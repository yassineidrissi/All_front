#!/usr/bin/env python3
"""Analyze latency (TFFT) and IPQ data for Q1.

The script expects two CSV files:
- turns.csv: one row per turn with timing information
- ipq.csv: one row per participant/condition with IPQ scores

It aggregates data per participant and condition, runs 2x2x2 repeated-
measures ANOVAs on TFFT and IPQ scores, computes Pearson correlations, and
emits basic plots.
"""
import argparse
import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from statsmodels.stats.anova import AnovaRM


def load_turns(path: str) -> pd.DataFrame:
    turns = pd.read_csv(path)
    # derive TFFT if not explicitly provided
    if 'tfft_ms' not in turns.columns:
        turns['tfft_ms'] = turns['t_audio_play_start_ms'] - turns['t_req_tx_ms']
    return turns


def aggregate(turns: pd.DataFrame, ipq: pd.DataFrame) -> pd.DataFrame:
    tfft = (
        turns.groupby(['participant_id', 'prompt_length', 'prompt_structure', 'emotion'])
        ['tfft_ms']
        .mean()
        .reset_index()
    )
    df = pd.merge(
        tfft,
        ipq,
        on=['participant_id', 'prompt_length', 'prompt_structure', 'emotion'],
        how='inner',
    )
    df['condition_id'] = (
        df['prompt_length'] + '_' + df['prompt_structure'] + '_' + df['emotion']
    )
    return df


def run_anova(df: pd.DataFrame, dv: str, out_path: str):
    aov = AnovaRM(
        df,
        depvar=dv,
        subject='participant_id',
        within=['prompt_length', 'prompt_structure', 'emotion'],
    ).fit()
    aov.anova_table.to_csv(out_path)
    return aov


def make_plots(df: pd.DataFrame, out_dir: str):
    sns.set_theme(style='whitegrid')

    plt.figure()
    sns.boxplot(data=df, x='condition_id', y='tfft_ms')
    plt.ylabel('TFFT (ms)')
    plt.title('TFFT by condition')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'tfft_boxplot.png'))

    plt.figure()
    sns.barplot(data=df, x='condition_id', y='ipq_presence', ci=None)
    plt.ylabel('IPQ Presence')
    plt.title('IPQ Presence by condition')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'ipq_presence_bar.png'))

    plt.figure()
    sns.barplot(data=df, x='condition_id', y='ipq_involvement', ci=None)
    plt.ylabel('IPQ Involvement')
    plt.title('IPQ Involvement by condition')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'ipq_involvement_bar.png'))


def main():
    ap = argparse.ArgumentParser(description='Q1 latency & IPQ analysis')
    ap.add_argument('--turns', required=True, help='CSV with turn timings')
    ap.add_argument('--ipq', required=True, help='CSV with IPQ scores')
    ap.add_argument('--out', required=True, help='directory for outputs')
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    turns = load_turns(args.turns)
    ipq = pd.read_csv(args.ipq)
    df = aggregate(turns, ipq)

    # run ANOVAs
    run_anova(df, 'tfft_ms', os.path.join(args.out, 'anova_tfft.csv'))
    run_anova(df, 'ipq_presence', os.path.join(args.out, 'anova_ipq_presence.csv'))
    run_anova(df, 'ipq_involvement', os.path.join(args.out, 'anova_ipq_involvement.csv'))

    # correlations
    corr = df[['tfft_ms', 'ipq_presence', 'ipq_involvement']].corr(method='pearson')
    corr.to_csv(os.path.join(args.out, 'correlations.csv'))

    # plots
    make_plots(df, args.out)

    print(f'Saved results to {args.out}')


if __name__ == '__main__':
    main()
