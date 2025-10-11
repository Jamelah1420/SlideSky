import os
import json
import pandas as pd
import io
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-flash"

# ---------------- Helpers ----------------
def sanitize_column_name(name: str) -> str:
    name = re.sub(r'[_\-\.\s]+', ' ', str(name)).strip()
    if not name: return "Unnamed Field"
    title = name.title()
    title = title.replace(' Id', ' ID').replace(' Uid', ' UID')
    title = re.sub(r'\bAvg\b', 'Average', title, flags=re.IGNORECASE)
    title = re.sub(r'\bSum\b', '', title, flags=re.IGNORECASE).strip()
    return title

def month_short(dt: pd.Timestamp) -> str:
    try:
        return dt.strftime('%b')
    except Exception:
        return str(dt)

def generate_context_summary(df: pd.DataFrame) -> dict:
    summary = {}
    df = df.rename(columns={col: sanitize_column_name(col) for col in df.columns})
    for col in df.columns:
        series = df[col]
        dtype = series.dtype.name
        nunique = series.nunique(dropna=True)
        if dtype in ['object', 'category'] and nunique < 20:
            examples = series.value_counts(dropna=True).index.tolist()[:5]
            context = f"Categories: {', '.join(map(str, examples))}"
        elif dtype in ['int64', 'float64', 'number']:
            try:
                mean = series.mean(); min_val = series.min(); max_val = series.max()
                context = f"Range: {min_val:,.1f} to {max_val:,.1f} (Mean: {mean:,.1f})"
            except:
                context = "Numeric details not available"
        else:
            context = f"Unique values: {nunique}"
        summary[col] = { "type": dtype, "context": context }
    return dict(list(summary.items())[:15])

def determine_key_metric(df: pd.DataFrame) -> str | None:
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) == 0: return None
    scores = {}
    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors='coerce').dropna()
        if series.empty: scores[col] = -1e9; continue
        var = series.var() if series.var() is not None else 0.0
        uniq_ratio = series.nunique() / max(1, len(series))
        is_intish = series.dtype.kind in 'iu'
        score = var
        if is_intish and uniq_ratio > 0.5: score *= 0.05
        if uniq_ratio < 0.9: score *= 1.2
        scores[col] = score
    return max(scores, key=scores.get) if scores else None

def determine_key_segment(df: pd.DataFrame, max_unique=50, min_unique=2) -> str | None:
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    candidates = []
    for col in categorical_cols:
        nunique = df[col].nunique(dropna=True)
        if min_unique <= nunique <= max_unique:
            null_rate = df[col].isna().mean()
            score = nunique - (null_rate * 10)
            candidates.append((col, score))
    if not candidates: return None
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]

def detect_time_column(df: pd.DataFrame) -> str | None:
    for col in df.columns:
        s = df[col]
        if pd.api.types.is_datetime64_any_dtype(s):
            return col
        # try parse
        if s.dtype == object:
            try:
                parsed = pd.to_datetime(s, errors='raise', infer_datetime_format=True)
                df[col] = parsed
                return col
            except Exception:
                continue
    return None

def safe_color(i: int) -> str:
    # simple palette
    palette = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#06b6d4','#84cc16','#f97316','#e11d48','#0ea5e9']
    return palette[i % len(palette)]

def to_float(v):
    try:
        f = float(v)
        if pd.isna(f): return 0.0
        return f
    except Exception:
        return 0.0

# ---------------- Chart spec generator (MODIFIED for diverse relationships) ----------------

def get_top_categorical_fields(df: pd.DataFrame, count: int = 3, max_unique: int = 50, min_unique: int = 2) -> list[str]:
    """Returns a list of the top 'count' most relevant categorical fields for charting."""
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    candidates = []
    for col in categorical_cols:
        nunique = df[col].nunique(dropna=True)
        if min_unique <= nunique <= max_unique:
            # Scoring: prioritize fields with a useful number of unique values and few nulls.
            null_rate = df[col].isna().mean()
            # Simple score: cardinality - penalty for nulls
            score = nunique - (null_rate * 10)
            candidates.append((col, score))
    candidates.sort(key=lambda x: x[1], reverse=True)
    return [col for col, score in candidates[:count]]


def generate_chart_specs(df: pd.DataFrame) -> list[dict]:
    df = df.copy()
    time_col = detect_time_column(df)
    main_value = determine_key_metric(df)
    
    if main_value is None:
        return []

    # Get multiple categorical fields for different analyses
    top_segments = get_top_categorical_fields(df, count=4, max_unique=20)
    primary_group = top_segments[0] if top_segments else None
    secondary_group = top_segments[1] if len(top_segments) > 1 else None
    tertiary_group = top_segments[2] if len(top_segments) > 2 else None

    chart_specs = []
    
    # STRATEGY 1: BAR CHART - Total values by primary group (Business Performance)
    if primary_group:
        total_by_primary = (
            df.groupby(primary_group, dropna=False)[main_value]
            .sum(numeric_only=True)
            .sort_values(ascending=False)
            .head(8)
        )
        if not total_by_primary.empty:
            bar_data = [{"category": str(idx), "value": round(to_float(val), 2), "color": safe_color(i)} 
                       for i, (idx, val) in enumerate(total_by_primary.items())]
            chart_specs.append({
                "sectionTitle": f"Total {sanitize_column_name(main_value)} by {primary_group}",
                "isChartSlide": True,
                "chartType": "bar",
                "chartData": bar_data
            })

    # STRATEGY 2: PIE CHART - Percentage contribution using COUNT distribution (Market Share)
    if secondary_group:
        # Use COUNT instead of SUM for completely different perspective
        count_distribution = df[secondary_group].value_counts(dropna=False).head(6)
        if len(count_distribution) > 1:
            total_count = count_distribution.sum()
            pie_data = []
            for i, (category, count) in enumerate(count_distribution.items()):
                percentage = (count / total_count) * 100
                pie_data.append({
                    "category": str(category),
                    "value": round(percentage, 1),
                    "color": safe_color(i)
                })
            
            if pie_data:
                chart_specs.append({
                    "sectionTitle": f"Distribution of Records by {secondary_group}",
                    "isChartSlide": True,
                    "chartType": "pie",
                    "chartData": pie_data
                })

    # STRATEGY 3: LINE CHART - Time-based trend (Performance Over Time)
    if time_col and len(chart_specs) < 3:
        try:
            ts_data = df[[time_col, main_value]].dropna()
            ts_data[time_col] = pd.to_datetime(ts_data[time_col], errors='coerce')
            ts_data = ts_data.dropna(subset=[time_col])
            
            if not ts_data.empty:
                # Use monthly averages for trend analysis
                monthly_avg = ts_data.set_index(time_col)[main_value].resample('MS').mean()
                if len(monthly_avg) >= 2:
                    line_data = [{"month": month_short(idx), "value": round(to_float(val), 2)} 
                                for idx, val in monthly_avg.items()]
                    chart_specs.append({
                        "sectionTitle": f"Monthly Trend of {sanitize_column_name(main_value)}",
                        "isChartSlide": True,
                        "chartType": "line",
                        "chartData": line_data
                    })
        except Exception:
            pass

    # STRATEGY 4: HORIZONTAL BAR - Efficiency/Performance ratios
    if len(chart_specs) < 3 and primary_group and secondary_group:
        try:
            # Calculate average values by primary group for efficiency comparison
            efficiency_data = (
                df.groupby(primary_group, dropna=False)[main_value]
                .mean(numeric_only=True)
                .sort_values(ascending=True)  # Sort for better horizontal bar display
                .head(8)
            )
            if not efficiency_data.empty:
                horizontal_data = [{"category": str(idx), "value": round(to_float(val), 2), "color": safe_color(i)} 
                                  for i, (idx, val) in enumerate(efficiency_data.items())]
                chart_specs.append({
                    "sectionTitle": f"Average {sanitize_column_name(main_value)} Efficiency",
                    "isChartSlide": True,
                    "chartType": "horizontal",
                    "chartData": horizontal_data
                })
        except Exception:
            pass

    # STRATEGY 5: AREA CHART - Cumulative growth
    if len(chart_specs) < 3 and time_col:
        try:
            ts_data = df[[time_col, main_value]].dropna()
            ts_data[time_col] = pd.to_datetime(ts_data[time_col], errors='coerce')
            ts_data = ts_data.dropna(subset=[time_col])
            
            if not ts_data.empty:
                cumulative_growth = ts_data.set_index(time_col)[main_value].resample('MS').sum().cumsum()
                if len(cumulative_growth) >= 2:
                    area_data = [{"month": month_short(idx), "value": round(to_float(val), 2)} 
                                for idx, val in cumulative_growth.items()]
                    chart_specs.append({
                        "sectionTitle": f"Cumulative Growth of {sanitize_column_name(main_value)}",
                        "isChartSlide": True,
                        "chartType": "area",
                        "chartData": area_data
                    })
        except Exception:
            pass

    # STRATEGY 6: Alternative - Value counts by tertiary field if others fail
    if len(chart_specs) < 3 and tertiary_group:
        value_counts = df[tertiary_group].value_counts(dropna=False).head(8)
        if not value_counts.empty:
            horizontal_data = [{"category": str(idx), "value": int(val), "color": safe_color(i)} 
                              for i, (idx, val) in enumerate(value_counts.items())]
            chart_specs.append({
                "sectionTitle": f"Record Count by {tertiary_group}",
                "isChartSlide": True,
                "chartType": "horizontal",
                "chartData": horizontal_data
            })

    return chart_specs[:3]

# --------------- Core Brief & Prompt (MODIFIED for AI-generated titles) ---------------

def generate_data_brief_and_prompt(df: pd.DataFrame) -> dict:
    if df.empty: return {"error": "DataFrame is empty."}
    df_sanitized = df.rename(columns={col: sanitize_column_name(col) for col in df.columns})
    context_summary = generate_context_summary(df)
    main_value = determine_key_metric(df_sanitized)
    if not main_value: return {"error": "No clear numeric value to analyze."}
    group_field = determine_key_segment(df_sanitized)

    series = pd.to_numeric(df_sanitized[main_value], errors="coerce")
    total_records = len(df_sanitized)
    total_sum = float(series.sum(skipna=True))
    average = float(series.mean(skipna=True)) if series.notna().any() else 0.0
    median_val = float(series.median(skipna=True)) if series.notna().any() else 0.0
    std_dev = float(series.std(skipna=True)) if series.notna().any() and len(series) > 1 else 0.0

    # Calculate additional statistics for unique insights
    top_10_pct = float(series.quantile(0.9)) if series.notna().any() else 0.0
    bottom_10_pct = float(series.quantile(0.1)) if series.notna().any() else 0.0
    cv = (std_dev / average) * 100 if average > 0 else 0  # Coefficient of variation

    top_group = "N/A"; share_text = "N/A"; balance_text = "No grouping available"
    if group_field:
        totals_mean = df_sanitized.groupby(group_field, dropna=False)[main_value].mean(numeric_only=True)
        total_value_by_group = df_sanitized.groupby(group_field, dropna=False)[main_value].sum(numeric_only=True)
        if not total_value_by_group.empty:
            top_group = str(total_value_by_group.idxmax())
            top_sum = float(total_value_by_group.max())
            share = (top_sum / total_sum) if total_sum > 0 else 0.0
            share_text = f"{share*100:.1f}%"
            if len(total_value_by_group) > 1:
                second = float(total_value_by_group.sort_values(ascending=False).iloc[1])
                if second > 0 and (top_sum / second) > 1.5: balance_text = "One group stands out clearly"
                else: balance_text = "Results are more evenly spread"
            else:
                balance_text = "Only one group found"

    brief = {
        "overview": {
            "records": total_records, 
            "mainValue": main_value, 
            "total": f"{total_sum:,.0f}", 
            "average": f"{average:,.0f}",
            "median": f"{median_val:,.0f}",
            "stdDev": f"{std_dev:,.0f}",
            "top10Percentile": f"{top_10_pct:,.0f}",
            "bottom10Percentile": f"{bottom_10_pct:,.0f}",
            "coefficientOfVariation": f"{cv:.1f}%"
        },
        "leaders": {"grouping": group_field or "N/A", "topGroup": top_group, "share": share_text, "balance": balance_text}
    }

    user_prompt = f"""
ROLE: You are an expert business communicator writing a summary for a dataset. Your content MUST be at a Grade 6 reading level and use context-specific terms derived from the column names and context summary.

DATA CONTEXT SUMMARY:
{json.dumps(context_summary, indent=2)}

DATA BRIEF (Key Facts):
{json.dumps(brief, indent=2)}

TASK: Generate an executive presentation with exactly 8 analytical sections (slides). Return ONLY JSON that strictly matches the provided schema.

OUTPUT SCHEMA:
- title: string
- sections: array of objects with:
    - sectionTitle: string (AI-generated relevant title for each slide)
    - points: array of strings

CONTENT RULES:
1. Generate 8 RELEVANT and MEANINGFUL section titles based on the data context. Titles should be:
   - Data-driven and specific to the dataset
   - Action-oriented and insightful
   - Varied to cover different analytical perspectives
   - Maximum 5 words each

2. Slide 1: Must be "About the Dataset" with EXACTLY 2 bullets: 
   - (1) Record count + total sum of main value
   - (2) Average + median + standard deviation

3. Slides 2-8: Each MUST have EXACTLY 3 concise, data-driven bullets (MAX 120 chars each), including concrete numbers.

4. CRITICAL: Each slide must present UNIQUE statistical insights - NO DUPLICATION of analysis across slides.

5. Use appropriate statistical measures for each slide type:
   - Overview slides: Use percentiles, ranges, coefficient of variation
   - Segment analysis: Use group comparisons and concentration ratios  
   - Trend analysis: Use time-based analysis, growth rates, patterns
   - Distribution: Use quartiles, frequency analysis, spread metrics
   - Comparative: Use ratios, percentages, relative performance
   - Outlier detection: Use z-scores, anomaly detection, extreme values
   - Strategic insights: Data-driven recommendations and observations

6. Do NOT include a concluding sentence or commentary outside of the bullet points.

7. Each bullet point MUST state a **fact or finding** derived directly from the data.

STYLE: Direct, simple, data-first communication. Output JSON only.

EXAMPLE TITLES (for inspiration only - create your own):
- "Performance Overview"
- "Top Segment Analysis" 
- "Monthly Trends & Patterns"
- "Value Distribution Insights"
- "Comparative Performance"
- "Anomaly Detection"
- "Strategic Recommendations"
- "Key Findings Summary"
""".strip()

    return {"brief": brief, "prompt": user_prompt}

# --------------- API (MODIFIED for AI-generated titles) ---------------

@app.route('/api/analyze', methods=['POST'])
def analyze_file():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    if not GEMINI_API_KEY: return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    try:
        file_bytes = file.read()
        file_buffer = io.BytesIO(file_bytes)
        ext = file.filename.split('.')[-1].lower()
        if ext in ('xlsx', 'xls'):
            df = pd.read_excel(file_buffer, engine='openpyxl')
        elif ext == 'csv':
            try:
                file_buffer.seek(0); df = pd.read_csv(file_buffer)
            except UnicodeDecodeError:
                file_buffer.seek(0); df = pd.read_csv(file_buffer, encoding='cp1252')
        else:
            return jsonify({"error": f"Unsupported file type: {ext}. Please use CSV or Excel."}), 400

        # Build brief + prompt
        analysis = generate_data_brief_and_prompt(df)
        if "error" in analysis: return jsonify({"error": analysis["error"]}), 400
        prompt = analysis["prompt"]

        # Call Gemini for text slides with AI-generated titles
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "title": types.Schema(type=types.Type.STRING),
                        "sections": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(
                                type=types.Type.OBJECT,
                                properties={
                                    "sectionTitle": types.Schema(type=types.Type.STRING),
                                    "points": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                                }
                            )
                        )
                    }
                )
            )
        )
        ai_presentation = json.loads(response.text)

        # Generate chart sections directly from the dataset
        chart_sections = generate_chart_specs(df)

        # Insert charts after specific text slides (slides 3, 5, and 7 - 0-indexed 2, 4, 6)
        ai_sections = ai_presentation.get("sections") or []
        target_slide_indices = [2, 4, 6]

        merged_sections = []
        chart_index = 0

        for i, section in enumerate(ai_sections):
            merged_sections.append(section)
            
            # Insert chart after the target slides if we have charts remaining
            if i in target_slide_indices and chart_index < len(chart_sections):
                merged_sections.append(chart_sections[chart_index])
                chart_index += 1

        # Add any remaining charts at the end if we didn't use all target positions
        while chart_index < len(chart_sections):
            merged_sections.append(chart_sections[chart_index])
            chart_index += 1

        presentation = {
            "title": ai_presentation.get("title", "Data Analysis Report"),
            "sections": merged_sections
        }
        
        # Ensure serializable
        return jsonify({"presentation": json.loads(json.dumps(presentation, default=lambda o: str(o)))})

    except Exception as e:
        print(f"Server Error: {e}")
        if 'No engine for filetype' in str(e):
            error_message = "Missing dependency: Please install 'openpyxl' (pip install openpyxl) to process Excel files."
        else:
            error_message = f"An unexpected error occurred during processing: {str(e)}"
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY is not set. Please configure your .env file.")
    app.run(debug=True, port=5000)