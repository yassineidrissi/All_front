# Q1 Latency & Presence Analysis

This folder bundles templates and a helper script to analyse Question 1 of the
study (latence & fluidité).

## Files
- `q1_turns_template.csv` – example logging output for each dialogue turn.
- `q1_ipq_template.csv` – example IPQ scores per participant/condition.
- `analyze_q1.py` – aggregates data, runs repeated-measures ANOVAs and produces
  plots.

## Usage
1. Collect your own `turns.csv` and `ipq.csv` following the column structure of
the templates.
2. Run the analysis:

```bash
python analyze_q1.py --turns turns.csv --ipq ipq.csv --out results
```

The script writes ANOVA tables (`anova_*.csv`), a correlation matrix
(`correlations.csv`), and plots (`tfft_boxplot.png`, `ipq_presence_bar.png`,
`ipq_involvement_bar.png`) inside the chosen output directory.

## Required columns

`turns.csv`:
- `participant_id`
- `prompt_length` (short|long)
- `prompt_structure` (spikes|libre)
- `emotion` (on|off)
- `t_req_tx_ms`
- `t_audio_play_start_ms`
- `tfft_ms` (optional; computed if absent)

`ipq.csv`:
- `participant_id`
- `prompt_length`
- `prompt_structure`
- `emotion`
- `ipq_presence`
- `ipq_involvement`

