# === BACKEND: server.py ===

import os
import json
import pandas as pd
# ... (rest of imports) ...
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

# --- FIXED_GENERATED_TITLES remain unchanged ---
FIXED_GENERATED_TITLES = [
    "Relevant Inquiries", 
    "About the Dataset", 
    
]

# ---------------- Helpers (unchanged) ----------------
def sanitize_column_name(name: str) -> str:
# ... (rest of helper functions) ...
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

# ---------------- Chart spec generator (unchanged) ----------------

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
    chart_sections: list[dict] = []

    if main_value is None:
        return chart_sections

    # 1. Get a ranked list of relevant categorical fields (segments)
    top_segments = get_top_categorical_fields(df, count=3, max_unique=15) # Limit max_unique for better visuals
    primary_group_field = top_segments[0] if top_segments else None

    # 2. BAR CHART: primary_group_field by sum(main_value)
    if primary_group_field:
        agg = (
            df.groupby(primary_group_field, dropna=False)[main_value]
              .sum(numeric_only=True)
              .sort_values(ascending=False)
              .head(8)
        )
        if not agg.empty:
            bar_data = [{"category": str(idx), "value": round(to_float(val), 2), "color": safe_color(i)} for i, (idx, val) in enumerate(agg.items())]
            chart_sections.append({
                "sectionTitle": f"Top {primary_group_field} by {sanitize_column_name(main_value)}",
                "isChartSlide": True,
                "chartType": "bar",
                "chartData": bar_data
            })

    # 3. PIE CHART: distribution (top 5 + other) using primary_group_field
    if primary_group_field:
        total = to_float(df[main_value].sum(numeric_only=True))
        if total > 0:
            sums = (
                df.groupby(primary_group_field, dropna=False)[main_value]
                  .sum(numeric_only=True)
                  .sort_values(ascending=False)
            )
            top5 = sums.head(5)
            other = sums.iloc[5:].sum() if len(sums) > 5 else 0.0
            pie_items = list(top5.items())
            pie_data = []
            for i, (cat, val) in enumerate(pie_items):
                pct = (to_float(val) / total) * 100.0
                pie_data.append({"category": str(cat), "value": round(pct, 1), "color": safe_color(i)})
            if other > 0:
                pie_data.append({"category": "Other", "value": round((to_float(other)/total)*100.0, 1), "color": safe_color(len(pie_items))})
            if pie_data:
                chart_sections.append({
                    "sectionTitle": f"{sanitize_column_name(main_value)} Share by {primary_group_field}",
                    "isChartSlide": True,
                    "chartType": "pie",
                    "chartData": pie_data
                })

    # 4. LINE CHART: monthly trend (if time data is present)
    if time_col:
        try:
            ts = df[[time_col, main_value]].dropna()
            ts[time_col] = pd.to_datetime(ts[time_col], errors='coerce')
            ts = ts.dropna(subset=[time_col])
            if not ts.empty:
                ts = ts.set_index(time_col).sort_index()
                monthly = ts[main_value].resample('MS').sum()
                if not monthly.empty and monthly.shape[0] >= 2:
                    line_data = [{"month": month_short(idx), "value": round(to_float(val), 2)} for idx, val in monthly.items()]
                    chart_sections.append({
                        "sectionTitle": f"Monthly {sanitize_column_name(main_value)} Trend",
                        "isChartSlide": True,
                        "chartType": "line",
                        "chartData": line_data
                    })
        except Exception:
            pass

    # 5. HORIZONTAL BAR: Second most relevant group (if different from primary)
    alt_group = next((g for g in top_segments if g != primary_group_field), None)
    
    if alt_group:
        agg = (
            df.groupby(alt_group, dropna=False)[main_value]
              .sum(numeric_only=True)
              .sort_values(ascending=False)
              .head(10)
        )
        if not agg.empty:
            hbar_data = [{"category": str(idx), "value": round(to_float(val), 2)} for idx, val in agg.items()]
            chart_sections.append({
                "sectionTitle": f"{sanitize_column_name(main_value)} by {alt_group}",
                "isChartSlide": True,
                "chartType": "horizontal",
                "chartData": hbar_data
            })

    # 6. STACKED: Cross-analysis of the top two relevant segments (if both low cardinality)
    if len(top_segments) >= 2:
        base, segment = top_segments[0], top_segments[1]
        
        # Check if cardinality is small enough for a clean stacked chart (max 8 categories)
        base_n = df[base].nunique(dropna=True)
        segment_n = df[segment].nunique(dropna=True)
        
        if base_n <= 8 and segment_n <= 8:
            pivot = df.pivot_table(index=base, columns=segment, values=main_value, aggfunc='sum', fill_value=0)
            
            # Keep top 6 base categories for readability
            totals = pivot.sum(axis=1).sort_values(ascending=False)
            pivot = pivot.loc[totals.head(6).index]
            
            # Keep top 4 segments
            seg_totals = pivot.sum(axis=0).sort_values(ascending=False)
            top_segments_for_chart = seg_totals.head(4).index.tolist()
            pivot = pivot[top_segments_for_chart]
            
            if not pivot.empty:
                stacked_data = []
                for i, (idx, row) in enumerate(pivot.iterrows()):
                    segments_list = [{"name": str(seg), "value": round(to_float(row.get(seg, 0.0)), 2), "color": safe_color(j)} for j, seg in enumerate(pivot.columns)]
                    stacked_data.append({"category": str(idx), "segments": segments_list})
                chart_sections.append({
                    "sectionTitle": f"{sanitize_column_name(main_value)} by {base} and {segment}",
                    "isChartSlide": True,
                    "chartType": "stacked",
                    "chartData": stacked_data
                })
    
    # Return a maximum of 5 charts to keep the deck focused and high-value.
    return chart_sections[:5]


# --------------- Core Brief & Prompt (MODIFIED) ---------------

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
        "overview": {"records": total_records, "mainValue": main_value, "total": f"{total_sum:,.0f}", "average": f"{average:,.0f}"},
        "leaders": {"grouping": group_field or "N/A", "topGroup": top_group, "share": share_text, "balance": balance_text}
    }

    # The model now generates 9 slides (excluding Contents)
      # The model now generates 8 slides (excluding Contents)
    analytical_titles_list = json.dumps(FIXED_GENERATED_TITLES, indent=2)
    user_prompt = f"""
ROLE: You are an expert business communicator writing a summary for a CEO. Your content MUST be at a Grade 6 reading level and use context-specific terms derived from the column names and context summary.

DATA CONTEXT SUMMARY:
{json.dumps(context_summary, indent=2)}

DATA BRIEF (Key Facts):
{json.dumps(brief, indent=2)}

TASK: Generate an executive presentation with exactly 8 analytical sections (slides). Return ONLY JSON that strictly matches the provided schema.

OUTPUT SCHEMA:
- title: string
- sections: array of objects with:
    - sectionTitle: string
    - points: array of strings

CONTENT RULES:
1. The eight section titles MUST be the EXACT titles listed below, in order.
{analytical_titles_list}

2. Slide 1 "About the Dataset": EXACTLY 2 bullets: (1) records + total sum, (2) average + topGroup + share + balance.
3. Slides 2-8: Each MUST have EXACTLY 3 concise, data-driven bullets (MAX 120 chars each), including concrete numbers.
4. Do NOT include a concluding sentence or commentary outside of the bullet points for any slide.
5. Each bullet point MUST state a **fact or finding** derived directly from the data; avoid stating intentions, methodology, or aspirational goals. (e.g., Use: 'Salary for full-time employees is $X.' NOT: 'We should check X for Y.')

STYLE: Direct, simple, data-first communication. Output JSON only.
""".strip()

    return {"brief": brief, "prompt": user_prompt}

# --------------- API (unchanged) ---------------

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

        # Call Gemini for text slides
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

        # Merge: keep AI text sections, then append charts
        merged_sections = (ai_presentation.get("sections") or []) + chart_sections

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