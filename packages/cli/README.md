# @prophet/cli

**Prophet CLI** - AI-powered code evolution system that works 24/7 to optimize your codebase.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @prophet/cli

# Initialize in your project
cd your-project
prophet init

# Start monitoring
prophet start

# Check status
prophet status

# Open dashboard
prophet dashboard
```

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @prophet/cli
```

### Local Installation

```bash
npm install --save-dev @prophet/cli
```

Then use via npx:

```bash
npx prophet init
```

## 🎯 Commands

### `prophet init`

Initialize Prophet in your project. This creates a `.prophet` directory with configuration.

**Options:**
- `-p, --path <path>` - Project path (default: current directory)

**Interactive prompts:**
- Project name
- Project type (web app, API, full stack, library)
- Features to enable (auto-TODO, refactoring, performance, testing, docs)
- Scan interval (1min, 3min, 5min, 10min)

**Example:**

```bash
prophet init
# or specify path
prophet init --path /path/to/project
```

### `prophet start`

Start Prophet monitoring and evolution.

**Options:**
- `-d, --daemon` - Run as daemon in background
- `-p, --port <port>` - Dashboard port (default: 3001)

**Examples:**

```bash
# Run in foreground (see live output)
prophet start

# Run in background
prophet start --daemon

# Custom port
prophet start --port 4000
```

### `prophet status`

Check Prophet running status and recent activity.

**Options:**
- `-v, --verbose` - Show detailed status including processes and report preview

**Example:**

```bash
prophet status

# Detailed view
prophet status --verbose
```

### `prophet dashboard`

Open Prophet dashboard in your default browser.

**Options:**
- `-p, --port <port>` - Dashboard port (default: 3001)

**Example:**

```bash
prophet dashboard

# Custom port
prophet dashboard --port 4000
```

## 🔮 What Prophet Does

Prophet continuously monitors your codebase and:

✅ **Fixes TODOs & FIXMEs** - Automatically resolves technical debt
✅ **Refactors Code** - Improves code quality and maintainability
✅ **Optimizes Performance** - Identifies and fixes performance bottlenecks
✅ **Generates Tests** - Creates unit tests for uncovered code
✅ **Updates Docs** - Keeps documentation in sync with code

All changes are committed with clear messages showing what was improved.

## 📊 Dashboard Features

The Prophet dashboard (`http://localhost:3001`) shows:

- **Real-time scanning status** - See what Prophet is analyzing
- **Evolution timeline** - Track all automatic improvements
- **Code quality metrics** - LOC, issues, technical debt
- **Activity feed** - Recent commits and optimizations
- **Project insights** - Patterns, recommendations, predictions

## 🗂 Project Structure

After `prophet init`, your project will have:

```
your-project/
├── .prophet/
│   ├── config.json          # Prophet configuration
│   ├── history/             # Evolution history
│   ├── reports/             # Generated reports
│   └── cache/               # Internal cache (gitignored)
```

## ⚙️ Configuration

Edit `.prophet/config.json` to customize:

```json
{
  "projectName": "my-app",
  "projectType": "web-app",
  "features": ["auto-todo", "refactoring", "performance"],
  "scanInterval": 180000,
  "version": "1.0.0"
}
```

**scanInterval** values:
- `60000` - Every minute (aggressive)
- `180000` - Every 3 minutes (recommended)
- `300000` - Every 5 minutes (conservative)
- `600000` - Every 10 minutes (relaxed)

## 🛑 Stopping Prophet

```bash
# If running in foreground: Ctrl+C

# If running as daemon:
pkill -f prophet

# Or find PID and kill:
prophet status
kill <PID>
```

## 🐛 Troubleshooting

### Prophet not starting

```bash
# Check if Prophet is initialized
prophet status

# Re-initialize if needed
prophet init

# Check for port conflicts
lsof -i :3001
```

### Dashboard not opening

Manually open: `http://localhost:3001`

Or check if Prophet Central is running:

```bash
prophet status --verbose
```

### Need help?

```bash
prophet --help
prophet <command> --help
```

## 📝 Example Workflow

```bash
# 1. Initialize
cd ~/projects/my-app
prophet init

# 2. Start (daemon mode)
prophet start --daemon

# 3. Check status
prophet status

# 4. Open dashboard to see results
prophet dashboard

# 5. Let Prophet work 24/7
# Check back later - Prophet will auto-commit improvements
```

## 🎨 Features

- **Interactive CLI** - Beautiful, user-friendly interface
- **Zero config** - Works out of the box with sensible defaults
- **Background mode** - Run as daemon, forget about it
- **Real-time dashboard** - See evolution in real time
- **Git integration** - All changes tracked and commitable
- **Cross-platform** - Works on macOS, Linux, Windows

## 📄 License

MIT

## 🤝 Contributing

Prophet is open source! Contributions welcome.

---

**Prophet** - Your AI coding partner that never sleeps 🔮
