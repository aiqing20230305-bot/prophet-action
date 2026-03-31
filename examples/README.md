# Prophet Workflow Examples

Choose the setup that matches your needs:

## 📘 [basic.yml](./basic.yml) - Recommended for most projects

- Runs every 6 hours
- Reports P1+ discoveries
- Creates GitHub Issues
- Auto-commits state to `.prophet/`

**Best for**: Individual projects, teams just starting with Prophet

---

## 🚀 [advanced.yml](./advanced.yml) - For power users

- Runs 4x per day + on code changes
- Only P0 discoveries (highest priority)
- Creates PRs instead of Issues
- Uploads state as artifacts
- Slack notifications on P0 finds

**Best for**: Fast-moving teams, projects with active development

---

## 💡 [minimal.yml](./minimal.yml) - Lightweight option

- Runs once per week (Monday 9am)
- Only P0 alerts
- Minimal GitHub Actions usage

**Best for**: Side projects, low-activity repos, free tier optimization

---

## Setup Instructions

1. **Create workflow file**: Copy one of the examples to `.github/workflows/prophet.yml`

2. **Add secrets** (Repository Settings → Secrets → Actions):
   - `CLAUDE_API_KEY`: Get from [console.anthropic.com](https://console.anthropic.com)
   - `SLACK_WEBHOOK_URL` (advanced.yml only): Optional Slack webhook

3. **Adjust permissions** (if needed):
   - `contents: write` - Required for `.prophet/` auto-commit
   - `issues: write` - Required for creating issues
   - `pull-requests: write` - Required for PR mode (advanced)

4. **Test**: Go to Actions tab → Prophet AI Agent → Run workflow

---

## Cost Comparison

| Setup | Runs/day | Actions min/day | Claude API/day | Free tier usage |
|-------|----------|-----------------|----------------|-----------------|
| Minimal | 0.14 (~1/week) | ~1 min/week | ~$0.10/week | ~5% |
| Basic | 4 | ~20-40 min | ~$0.40-2.00 | ~50% |
| Advanced | 4-8 | ~40-80 min | ~$0.80-4.00 | ~100% |

*Based on 5-10 min/run for Actions, $0.10-0.50/run for Claude API*

---

## Customization

### Change schedule

```yaml
on:
  schedule:
    - cron: '0 */12 * * *'  # Every 12 hours
    - cron: '0 9 * * 1-5'   # Weekdays at 9am
    - cron: '0 0 1 * *'     # First day of month
```

### Change priority threshold

```yaml
priority-threshold: 'P0'  # Only highest priority
priority-threshold: 'P1'  # P0 + P1 (default)
priority-threshold: 'P2'  # P0 + P1 + P2
```

### Change notification channel

```yaml
notification-channel: 'issues'   # Create GitHub Issues (default)
notification-channel: 'comment'  # Comment on latest commit
notification-channel: 'pr'       # Create Pull Requests
```

---

## Troubleshooting

**"Missing required key 'CLAUDE_API_KEY'"**
- Add the secret in Repository Settings → Secrets → Actions

**"Permission denied" on `.prophet/` commit**
- Add `contents: write` permission to the job

**"No discoveries in multiple runs"**
- This is normal! Prophet only reports relevant trends
- Check `.prophet/analysis/latest.json` for all analyzed items
- Lower `priority-threshold` to `P2` or `P3` to see more results

---

## Next Steps

- 📖 Read the [full documentation](../README.md)
- 🐛 Report issues on [GitHub](https://github.com/aiqing20230305-bot/prophet-action/issues)
- ⭐ Star the repo if Prophet helps you discover something valuable!
