import json
import re

def extract_responses(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scrape_ideas = []
    idea_detailing = None
    fn_names = []  # debug helper

    for entry in data:
        if "content" in entry and "parts" in entry["content"]:
            for part in entry["content"]["parts"]:
                if "functionResponse" not in part:
                    continue

                fn_name = part["functionResponse"]["name"]
                fn_names.append(fn_name)

                # --- Scrape agents ---
                if fn_name.startswith("scrape_"):
                    resp = part["functionResponse"]["response"]
                    if "result" in resp:
                        match = re.search(r"(\[.*\])", resp["result"], re.DOTALL)
                        if match:
                            try:
                                parsed_ideas = json.loads(match.group(1))
                                if isinstance(parsed_ideas, list):
                                    scrape_ideas.extend(parsed_ideas)
                            except json.JSONDecodeError:
                                print(f"⚠️ Could not parse scrape ideas from {fn_name}")

                # --- Idea detailing agent (correct marker) ---
                if fn_name == "set_model_response":
                    resp = part["functionResponse"]["response"]
                    if isinstance(resp, dict) and "ideas" in resp:
                        idea_detailing = resp["ideas"]
                    elif isinstance(resp, list):
                        idea_detailing = resp

    if not scrape_ideas:
        raise ValueError("❌ No scrape agent responses found in file.")
    if not idea_detailing:
        raise ValueError(
            f"❌ No idea detailing agent response found. "
            f"FunctionResponse names seen: {set(fn_names)}"
        )

    # --- Enrich detailing with URL from scrape ideas ---
    title_to_url = {idea.get("title"): idea.get("url") for idea in scrape_ideas if "title" in idea}
    for det in idea_detailing:
        if isinstance(det, dict):
            title = det.get("title")
            if title and title in title_to_url:
                det["url"] = title_to_url[title]

    return scrape_ideas, idea_detailing


if __name__ == "__main__":
    file_path = "pipeline_response.txt"
    scrape_ideas, idea_detailing = extract_responses(file_path)

    with open("scrape_agents_ideas.json", "w", encoding="utf-8") as f:
        json.dump(scrape_ideas, f, indent=2, ensure_ascii=False)

    with open("idea_detailing_agent_response.json", "w", encoding="utf-8") as f:
        json.dump(idea_detailing, f, indent=2, ensure_ascii=False)

    print("✅ Extracted successfully:")
    print(f" - scrape_agents_ideas.json ({len(scrape_ideas)} ideas total)")
    print(f" - idea_detailing_agent_response.json ({len(idea_detailing)} analyses, enriched with URLs)")
