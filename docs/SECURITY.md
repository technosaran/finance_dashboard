# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently, the following versions are supported:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The FINCORE team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### Where to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing the maintainers or creating a private security advisory on GitHub:

1. Go to https://github.com/technosaran/fin_dashboard/security/advisories/new
2. Fill in the details of the vulnerability
3. Click "Submit report"

Alternatively, you can email the security concerns to the project maintainers.

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass, etc.)
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 72 hours
- **Initial Assessment**: We will provide an initial assessment within 7 days
- **Fix Timeline**: We aim to release a fix within 30 days for critical vulnerabilities
- **Public Disclosure**: We will coordinate with you on the timing of public disclosure

### Preferred Languages

We prefer all communications to be in English.

## Security Measures

### Current Security Features

1. **Authentication**: Supabase Auth with Row Level Security (RLS)
2. **Database**: PostgreSQL with RLS policies enforcing user data isolation
3. **API Security**: Server-side validation and sanitization
4. **Dependencies**: Regular dependency updates and vulnerability scanning
5. **HTTPS**: All production deployments use HTTPS
6. **Environment Variables**: Sensitive data stored in environment variables

### Security Best Practices

When contributing to this project:

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Keep dependencies up to date
- Use TypeScript strict mode for type safety
- Implement proper error handling without exposing sensitive information

## Security Updates

Security updates will be announced through:

- GitHub Security Advisories
- Release notes in CHANGELOG.md
- GitHub Releases

## Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities (with their permission) in our security advisories and release notes.
