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

# Load environment variables from a .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
# NOTE: Ensure you have a GEMINI_API_KEY set in your .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-flash"

# --- FIXED LIST OF ALL 10 SLIDE TITLES THE CLIENT EXPECTS TO RECEIVE ---
FIXED_GENERATED_TITLES = [
    "Contents", 
    "Relevant Inquiries", 
    "About the Dataset", 
    "Highest Earning Employee Positions", 
    "How Performance Affects Pay", 
    "Salary Gaps by Gender", 
    "Departmental Salary Ranges", 
    "Marital Status and Employee Pay", 
    "Salaries of Employees from Diversity Fairs", 
    "Employee Status and Compensation", 
]
# --- END NEW ---

# =============== Helpers (NO CHANGE) ===============

def sanitize_column_name(name: str) -> str:
    """Cleans up raw column names for better presentation."""
    name = re.sub(r'[_\-\.\s]+', ' ', str(name)).strip()
    if not name:
        return "Unnamed Field"
    title = name.title()
    title = title.replace(' Id', ' ID').replace(' Uid', ' UID')
    title = re.sub(r'\bAvg\b', 'Average', title, flags=re.IGNORECASE)
    title = re.sub(r'\bSum\b', '', title, flags=re.IGNORECASE).strip()
    return title

def generate_context_summary(df: pd.DataFrame) -> dict:
    """
    Generates a brief summary of all columns, including data types, 
    uniqueness, and a few sample values for context.
    """
    summary = {}
    
    # Use sanitized names for the summary
    df = df.rename(columns={col: sanitize_column_name(col) for col in df.columns})

    for col in df.columns:
        series = df[col]
        dtype = series.dtype.name
        nunique = series.nunique(dropna=True)
        
        # Determine contextually relevant examples
        examples = []
        if dtype in ['object', 'category'] and nunique < 20:
            # For categorical data, list all categories
            examples = series.value_counts(dropna=True).index.tolist()[:5]
            context = f"Categories: {', '.join(map(str, examples))}"
        elif dtype in ['int64', 'float64', 'number']:
            # For numeric data, list min, max, mean
            try:
                mean = series.mean()
                min_val = series.min()
                max_val = series.max()
                # Use a smaller sample if the data is massive to avoid memory issues, though usually safe here
                context = f"Range: {min_val:,.1f} to {max_val:,.1f} (Mean: {mean:,.1f})"
            except:
                context = "Numeric details not available"
        else:
            # For high-cardinality strings/IDs, just show type
            context = f"Unique values: {nunique}"

        summary[col] = {
            "type": dtype,
            "context": context
        }
        
    # Limit the summary to the first 15 columns to keep the prompt size manageable
    return dict(list(summary.items())[:15])

def determine_key_metric(df: pd.DataFrame) -> str | None:
    """
    Pick a numeric column that looks useful for executives (e.g., Salary, Revenue, Score).
    """
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) == 0:
        return None

    scores = {}
    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors='coerce').dropna()
        if series.empty:
            scores[col] = -1e9
            continue
        # Use variance/std_dev as a proxy for interestingness (non-uniform data)
        var = series.var() if series.var() is not None else 0.0
        uniq_ratio = series.nunique() / max(1, len(series))
        is_intish = series.dtype.kind in 'iu'
        score = var
        # Penalize ID-like columns (high uniqueness, integer-like)
        if is_intish and uniq_ratio > 0.5:
            score *= 0.05
        # Reward columns that have aggregation potential
        if uniq_ratio < 0.9:
            score *= 1.2
        scores[col] = score

    return max(scores, key=scores.get) if scores else None

def determine_key_segment(df: pd.DataFrame, max_unique=50, min_unique=2) -> str | None:
    """
    Choose a categorical column suitable for an executive 'leader' view.
    """
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    candidates = []
    for col in categorical_cols:
        nunique = df[col].nunique(dropna=True)
        if min_unique <= nunique <= max_unique:
            # Prefer slightly richer groupings, penalize nulls
            null_rate = df[col].isna().mean()
            score = nunique - (null_rate * 10)
            candidates.append((col, score))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]

# =============== Core Brief & Prompt (MODIFIED) ===============

def generate_data_brief_and_prompt(df: pd.DataFrame) -> dict:
    """
    Generates a data brief and the executive presentation prompt for the Gemini model.
    """
    if df.empty:
        return {"error": "DataFrame is empty."}

    # 1) Sanitize column names (copy to avoid modifying caller)
    df_sanitized = df.rename(columns={col: sanitize_column_name(col) for col in df.columns})

    # 2) Generate Deep Context Summary
    context_summary = generate_context_summary(df) 

    # 3) Choose main numeric value and a grouping field using the sanitized DF
    main_value = determine_key_metric(df_sanitized)
    if not main_value:
        return {"error": "No clear numeric value to analyze."}
    group_field = determine_key_segment(df_sanitized)

    # 4) Core numbers
    series = pd.to_numeric(df_sanitized[main_value], errors="coerce")
    total_records = len(df_sanitized)
    total_sum = float(series.sum(skipna=True))
    average = float(series.mean(skipna=True)) if series.notna().any() else 0.0

    # 5) Top group (leader) & balance (plain wording)
    top_group = "N/A"
    share_text = "N/A"
    balance_text = "No grouping available"
    if group_field:
        # Use mean for a key metric, as sum can be misleading if group sizes vary greatly
        totals = df_sanitized.groupby(group_field, dropna=False)[main_value].mean(numeric_only=True)
        
        # Re-calculating sum for 'share' in case it's more relevant for a total metric like 'Revenue'
        total_value_by_group = df_sanitized.groupby(group_field, dropna=False)[main_value].sum(numeric_only=True)
        
        if not total_value_by_group.empty:
            top_group = str(total_value_by_group.idxmax())
            top_sum = float(total_value_by_group.max())
            share = (top_sum / total_sum) if total_sum > 0 else 0.0
            share_text = f"{share*100:.1f}%"
            if len(total_value_by_group) > 1:
                second = float(total_value_by_group.sort_values(ascending=False).iloc[1])
                if second > 0 and (top_sum / second) > 1.5:
                    balance_text = "One group stands out clearly"
                else:
                    balance_text = "Results are more evenly spread"
            else:
                balance_text = "Only one group found"

    # 6) Build a compact brief (no tech terms)
    brief = {
        "overview": {
            "records": total_records,
            "mainValue": main_value,
            "total": f"{total_sum:,.0f}",
            "average": f"{average:,.0f}",
        },
        "leaders": {
            "grouping": group_field or "N/A",
            "topGroup": top_group,
            "share": share_text,
            "balance": balance_text,
        }
    }

    # 7) Executive prompt (UPDATED: Added a strict character limit for analytical bullet points)
    
    # 7a. Prepare the list of analytical titles for injection into the prompt
    analytical_titles_list = json.dumps(FIXED_GENERATED_TITLES, indent=2)

    user_prompt = f"""
ROLE: You are an expert business communicator writing a summary for a CEO. Your content MUST be at a **Grade 6 reading level** and use **context-specific terms** derived from the column names and context summary below (e.g., use 'revenue' or 'sales' instead of just 'value').

DATA CONTEXT SUMMARY:
{json.dumps(context_summary, indent=2)}

DATA BRIEF (Key Facts):
{json.dumps(brief, indent=2)}

TASK: Generate an executive presentation with **exactly 10 sections (slides)**. Return ONLY JSON that strictly matches the provided schema.

OUTPUT SCHEMA:
- title: string (A concise, business-focused title, e.g., "Quarterly Revenue Summary")
- sections: array of objects with:
    - sectionTitle: string (A clear, concise, and analytical title for the slide)
    - points: array of strings

CONTENT RULES:
1.  **CRITICAL INSTRUCTION: The ten section titles MUST be the EXACT titles listed below, in the provided order.**

    REQUIRED SECTION TITLES (Slides 1-10):
    {analytical_titles_list}

2.  **Slide 1: "Contents"**
    * **Points:** Provide **EXACTLY 2** bullet points that summarize the **scope** and **main finding** of the analysis. The client-side logic will process these later.

3.  **Slide 2: "Relevant Inquiries"**
    * **Points:** Provide **EXACTLY 2** simple, clear bullet points about **key questions** the data can answer. The client-side logic uses this as content for a later slide.

4.  **Slide 3: "About the Dataset"**
    * **Points:** Provide **EXACTLY 2** simple, clear, and impactful bullet points.
        * **Point 1 (Main Facts):** Include the **total number of records** and the **total sum** of the main value.
        * **Point 2 (Key Statistics):** Explain the **Average** of the main value, the **topGroup** name, its **share** (in percent), and the statement about **balance**.

5.  **Slides 4-10 (Analytical Content):**
    * **Goal:** These sections must be **deep, analytical inquiries** focused on the **most important relationships, trends, and equity issues** in the data.
    * **Points:** Each analytical slide must have **3 to 5** bullet points.
    * **CRITICAL LENGTH LIMIT:** **Each individual bullet point MUST be concise, under 200 characters in length.**
        * **Point 1 (Disparity/Outlier):** Start with a key finding, like "Salaries vary significantly across [grouping fields], with [specific subgroup] earning the highest mean [mainValue] of [concrete number] USD."
        * **Point 2-3 (Performance/Correlation):** Explore a correlation (e.g., 'Exceeds' performance has a mean salary of [concrete number] USD, while 'PIP' has the lowest at [concrete number] USD).
        * **Point 4-5 (Conclusion/Action):** Suggest a final outlier fact or an action (e.g., "High maximum salaries in 'X' suggest top performers can earn significantly more.").
    * **Concrete Numbers:** All analytical bullet points **MUST** contain specific, calculated, concrete numbers derived from the data context and the implied data distribution (mean, min, max, count, percentage). Use the USD currency symbol if the `mainValue` implies a salary or monetary value.

STYLE: Use extremely direct, simple, and context-aware language. Do not use technical jargon. Output JSON only.
    """.strip()

    return {"brief": brief, "prompt": user_prompt}

# =============== API Endpoint (NO CHANGE) ===============

@app.route('/api/analyze', methods=['POST'])
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    try:
        # Read the file into memory for safe parsing
        file_bytes = file.read()
        file_buffer = io.BytesIO(file_bytes)

        # Load into DataFrame
        ext = file.filename.split('.')[-1].lower()
        if ext in ('xlsx', 'xls'):
            # The 'openpyxl' engine is required for reading Excel files
            df = pd.read_excel(file_buffer, engine='openpyxl')
        elif ext == 'csv':
            try:
                file_buffer.seek(0)
                df = pd.read_csv(file_buffer)
            except UnicodeDecodeError:
                file_buffer.seek(0)
                df = pd.read_csv(file_buffer, encoding='cp1252')
        else:
            return jsonify({"error": f"Unsupported file type: {ext}. Please use CSV or Excel."}), 400

        # Build brief + prompt
        analysis = generate_data_brief_and_prompt(df)
        if "error" in analysis:
            return jsonify({"error": analysis["error"]}), 400

        prompt = analysis["prompt"]

        # Call Gemini
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
                                    "points": types.Schema(
                                        type=types.Type.ARRAY,
                                        items=types.Schema(type=types.Type.STRING)
                                    ),
                                }
                            )
                        )
                    }
                )
            )
        )

        return jsonify({"presentation": json.loads(response.text)})

    except Exception as e:
        print(f"Server Error: {e}")
        # A more helpful error message for common library issues
        if 'No engine for filetype' in str(e):
            error_message = "Missing dependency: Please install 'openpyxl' (pip install openpyxl) to process Excel files."
        else:
            error_message = f"An unexpected error occurred during processing: {str(e)}"
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    # Ensure you set GEMINI_API_KEY in a .env file or environment variables
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY is not set. Please configure your .env file.")
    app.run(debug=True, port=5000)