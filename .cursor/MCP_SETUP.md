# MCP & Environment Setup Guide

## 📋 Quick Setup

### 1. Copy MCP Configuration
```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

### 2. Copy Environment Variables
```bash
cp .env.example .env.local
```

### 3. Fill in Your API Keys

#### In `.cursor/mcp.json`:
- `GITHUB_PERSONAL_ACCESS_TOKEN`: Your GitHub token (needs repo access)
- `SUPABASE_ACCESS_TOKEN`: Your Supabase service token (`sbp_...`)

#### In `.env.local`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## 🔐 Where to Find Your Keys

### GitHub Token
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`, `admin:org`
4. Copy the token (starts with `ghp_...`)

### Supabase Tokens
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. **Anon Key**: Copy from "Project API keys" → "anon public"
3. **Service Token**: Go to https://supabase.com/dashboard/account/tokens
4. Generate a new access token (starts with `sbp_...`)

## 🚀 Restart Cursor

After updating the config files, **completely restart Cursor** (Quit + Reopen) for MCPs to load.

## ✅ Verify Setup

Once restarted, you should see in Cursor:
- 📦 **task-master-ai** MCP (task management)
- 🐙 **github** MCP (~93 tools)
- 🗄️ **supabase** MCP (~29 tools)

## 🔄 Switching Branches

When you switch branches and your `.cursor/mcp.json` is missing:
```bash
cp .cursor/mcp.json.example .cursor/mcp.json
# Fill in your keys again (or copy from another branch)
```

## 🔒 Security Note

**NEVER commit** these files:
- `.cursor/mcp.json` (contains API keys)
- `.env.local` (contains secrets)

They are in `.gitignore` for safety!
