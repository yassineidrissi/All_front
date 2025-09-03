import json, argparse
from typing import List, Tuple

def _ensure_list(x):
    if isinstance(x, str): return [x]
    return list(x)

def bertscore_f1(refs: List[str], hyps: List[str], lang: str = "en") -> Tuple[List[float], float]:
    from bert_score import score
    P, R, F1 = score(hyps, refs, lang=lang, rescale_with_baseline=True)
    scores = F1.tolist()
    return scores, sum(scores)/len(scores)

def bleurt_scores(refs: List[str], hyps: List[str], ckpt: str = "bleurt-20") -> Tuple[List[float], float]:
    # pip install bleurt tensorflow
    from bleurt import score as bleurt_score
    import os
    # Auto-download if needed (Google hosts ckpts)
    ckpt_dir = os.path.expanduser(f"~/.bleurt/{ckpt}")
    scorer = bleurt_score.BleurtScorer(ckpt_dir if os.path.exists(ckpt_dir) else ckpt)
    scores = scorer.score(references=refs, candidates=hyps)
    return scores, sum(scores)/len(scores)

def delta_metric(refs, p0, p1, metric="bertscore", lang="en"):
    if metric == "bertscore":
        _, m0 = bertscore_f1(refs, p0, lang)
        _, m1 = bertscore_f1(refs, p1, lang)
    elif metric == "bleurt":
        _, m0 = bleurt_scores(refs, p0)
        _, m1 = bleurt_scores(refs, p1)
    else:
        raise ValueError("metric must be 'bertscore' or 'bleurt'")
    return m1 - m0, m0, m1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refs", required=True, help="JSON list or path")
    ap.add_argument("--p0", required=True, help="JSON list or path")
    ap.add_argument("--p1", required=True, help="JSON list or path")
    ap.add_argument("--metric", choices=["bertscore","bleurt"], default="bertscore")
    ap.add_argument("--lang", default="en")
    args = ap.parse_args()

    def load(x):
        try:
            return json.loads(x)
        except json.JSONDecodeError:
            with open(x, "r", encoding="utf-8") as f: return json.load(f)

    refs = _ensure_list(load(args.refs))
    p0   = _ensure_list(load(args.p0))
    p1   = _ensure_list(load(args.p1))
    assert len(refs)==len(p0)==len(p1), "refs, p0, p1 must align"

    delta, m0, m1 = delta_metric(refs, p0, p1, metric=args.metric, lang=args.lang)
    print(json.dumps({"metric": args.metric, "m0": m0, "m1": m1, "delta": delta}, ensure_ascii=False))

if __name__ == "__main__":
    main()
