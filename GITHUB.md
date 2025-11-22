# Pushing to GitHub

## Super Simple Version

1. **Create a new repo on GitHub**
   - Go to https://github.com/new
   - Name it: `GooseGame` or `goose-migration-game`
   - Make it public
   - **DON'T** add README, .gitignore, or license (we have them!)
   - Click "Create repository"

2. **Copy the commands GitHub shows you**
   They'll look like:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/GooseGame.git
   git branch -M main
   git push -u origin main
   ```

3. **Run those commands in your terminal**
   - Open terminal in VSCode (Terminal → New Terminal)
   - Make sure you're in the `GooseGameWeb` folder
   - Paste and run those commands

4. **Done!** 🎉
   Your code is now on GitHub!

## Detailed Steps

### Step 1: Create GitHub Repo

Go to GitHub and create a new repository. You'll see something like this:

```
Quick setup — if you've done this kind of thing before

...or push an existing repository from the command line

git remote add origin https://github.com/YOUR_USERNAME/GooseGame.git
git branch -M main  
git push -u origin main
```

### Step 2: Run Commands

**In your VSCode terminal:**

```bash
# Navigate to project (if not already there)
cd GooseGameWeb

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/GooseGame.git

# Rename branch to 'main'
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username!

### Step 3: Enter Credentials

GitHub will ask for authentication. You have two options:

#### Option A: GitHub CLI (Easiest)
```bash
# Install GitHub CLI first
gh auth login
```
Then follow prompts!

#### Option B: Personal Access Token
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token
3. Give it `repo` permissions
4. Copy the token
5. Use it as your password when pushing

### Step 4: Verify

Go to `https://github.com/YOUR_USERNAME/GooseGame` and you should see all your files!

## Future Updates

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

## Common Issues

**"Repository not found"**
- Check you spelled the repo name correctly
- Make sure the repo exists on GitHub

**"Authentication failed"**
- Use a Personal Access Token, not your password
- Or use GitHub CLI (`gh auth login`)

**"fatal: not a git repository"**
- Make sure you're in the `GooseGameWeb` folder
- Run `git init` if needed (already done for you!)

## Alternative: Upload via GitHub Web

Don't want to use command line?

1. Create repo on GitHub
2. Click "uploading an existing file"
3. Drag and drop all your files
4. Commit!

(Not recommended for developers, but it works!)

---

## You're All Set! 🚀

Once pushed, your GitHub repo will have:
- ✅ Clean code
- ✅ Professional README
- ✅ Working game
- ✅ Good commit history

Perfect for sharing with potential employers!
