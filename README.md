# Prophet AI Agent

> AI-driven tech radar that discovers global trends, learns, and integrates automatically

Prophet is not just another automation tool — it's an **autonomous AI agent** that:

1. 🔍 **Scouts** HackerNews + GitHub Trending (60+ items/day)
2. 🧠 **Analyzes** with AI relevance scoring (P0/P1/P2/P3)
3. 📚 **Learns** by generating actionable plans + TODOs
4. ✅ **Validates** through PDCA loop (Plan-Do-Check-Act)
5. 🔄 **Evolves** by self-refactoring complex code

## Quick Start

Add to `.github/workflows/prophet.yml`:

```yaml
name: Prophet AI Agent
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  prophet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: prophet-ai/prophet-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
```

Prophet will:
- Discover relevant projects from global tech trends
- Create GitHub Issues for P0 discoveries
- Commit knowledge to `.prophet/` directory

## Configuration

### Required Secrets

- `GITHUB_TOKEN`: Auto-provided by GitHub Actions
- `CLAUDE_API_KEY`: Get from [console.anthropic.com](https://console.anthropic.com)

### Optional Inputs

- `priority-threshold`: Report P0, P1, P2, or P3+ (default: `P1`)
- `notification-channel`: `issues` (default), `comment`, or `pr`

## Cost

- **GitHub Actions**: ~5-10 min/run (60% of free tier if 4x/day)
- **Claude API**: ~$0.10-0.50/run (you provide the key)

## How It Works

Prophet combines three paradigm shifts:

1. **From passive to active**: Doesn't wait for PRs, proactively discovers
2. **From rules to AI**: Not regex-driven like Renovate, uses LLM reasoning
3. **From automation to autonomy**: Self-evolves, validates, and improves

### Example Output

```markdown
🔴 P0 Discovery: larksuite/cli

Relevance: 95/100
Why: TypeScript CLI framework with 19 AI Skills — 
     directly applicable to your AgentForge project

Recommendations:
- Review architecture patterns for AI skill registration
- Evaluate SDK integration approach
- Consider adopting command routing design

Learning Plan: 5 hours (saved to .prophet/)
TODOs: Created 3 actionable items
```

## What Makes Prophet Different

| Feature | Renovate | Prophet |
|---------|----------|---------|
| Input | Dependency updates | Global tech trends (HN + GitHub) |
| Analysis | Rule-based | AI-driven relevance scoring |
| Output | PR | Learning plans + Issues |
| Evolution | Static | Self-refactoring + PDCA validation |

## Development

Prophet has completed 16 phases of development:

- Phase 1-6: Scout + Analyzer + Notifier
- Phase 7-12: Executor + Self-healing + Multi-project
- Phase 13-15: Self-refactoring (complexity + duplication)
- Phase 16: PDCA validation loop

Test coverage: 30% (50 test files)

## License

MIT

## Credits

Built with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.6
