# Contributing to EKA-AI Platform

First off, thank you for considering contributing to EKA-AI Platform! It's people like you that make this automotive intelligence platform better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct (see CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and what you expected to see
* **Include screenshots or animated GIFs** if relevant
* **Include your environment details** (OS, browser, Node.js version, Python version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the suggested enhancement
* **Explain why this enhancement would be useful**
* **List any alternatives** you've considered

### Pull Requests

* Fill in the pull request template
* Follow the coding style used throughout the project
* Include appropriate test coverage
* Update documentation as needed
* End all files with a newline

## Development Process

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/eka-ai-platform.git
   cd eka-ai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Add your GEMINI_API_KEY to server/.env
   ```

4. **Run the application locally**
   ```bash
   ./start.sh
   ```

### Coding Standards

#### TypeScript/React (Frontend)

* Use TypeScript for all new files
* Follow React best practices and hooks guidelines
* Use functional components over class components
* Keep components focused and single-purpose
* Use meaningful variable and function names
* Add JSDoc comments for complex functions

#### Python (Backend)

* Follow PEP 8 style guidelines
* Use type hints where appropriate
* Write docstrings for all functions and classes
* Keep functions focused and single-purpose
* Handle errors gracefully with proper error messages

#### General Guidelines

* Write clear, self-documenting code
* Comment complex logic but avoid obvious comments
* Keep line length reasonable (< 100 characters preferred)
* No console.log or print statements in production code
* Use consistent indentation (2 spaces for TS/JS, 4 spaces for Python)

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
Add vehicle diagnostics export feature

- Implement PDF export for diagnostic reports
- Add CSV export for service history
- Update documentation with export examples

Fixes #123
```

### Branch Naming

* `feature/your-feature-name` for new features
* `bugfix/issue-description` for bug fixes
* `docs/what-you-are-documenting` for documentation
* `refactor/what-you-are-refactoring` for refactoring

### Testing

* Write tests for new features
* Ensure all tests pass before submitting PR
* Aim for high test coverage on critical paths
* Test both success and error scenarios

Run tests:
```bash
npm test                    # Frontend tests (when available)
cd server && pytest         # Backend tests (when available)
```

### Documentation

* Update README.md if you change setup or usage
* Update API documentation for new endpoints
* Add inline documentation for complex code
* Update ARCHITECTURE.md for architectural changes

## Project Structure

```
eka-ai-platform/
├── components/          # React components
├── services/           # API service layers
├── server/             # Flask backend
│   ├── app.py         # Main Flask application
│   └── requirements.txt
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main React application
└── README.md          # Project documentation
```

## Security

* Never commit API keys or sensitive data
* Use environment variables for configuration
* Follow security best practices (see SECURITY.md)
* Report security vulnerabilities privately (see SECURITY.md)

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README.md and release notes. Thank you for your contributions!

---

Remember: Quality over quantity. A well-thought-out, tested, and documented contribution is much more valuable than a rushed one.
