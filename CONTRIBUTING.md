# Contributing to ScholarGate

Thank you for your interest in contributing to **ScholarGate**! We welcome contributions from developers, educators, and community members of all skill levels.

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/CMS-ScholarGate.git
   cd CMS-ScholarGate
   ```

2. **Backend Setup**:
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database & Seed**:
   ```bash
   touch database/database.sqlite
   php artisan migrate --seed
   ```

4. **Frontend Assets Setup**:
   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

5. **Start Laravel Backend Server**:
   ```bash
   php artisan serve
   ```

---

## 🌿 Branching Strategy

- **`main`**: Production-ready branch. All commits must be tested and reviewed before merging.
- **`feature/*`**: New features or enhancements (e.g., `feature/custom-widgets`).
- **`fix/*`**: Bug fixes (e.g., `fix/auth-redirect`).
- **`docs/*`**: Documentation updates.

---

## 🧪 Testing & Quality Assurance

Before submitting a Pull Request, please ensure all automated tests pass locally:

```bash
# Run PHPUnit test suite
php artisan test

# Verify TypeScript types
npm run typecheck

# Verify production asset build
npm run build
```

---

## 📥 Submitting a Pull Request (PR)

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add support for custom announcement banners"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/my-awesome-feature
   ```
4. Open a **Pull Request** on GitHub against the `main` branch.
5. Provide a summary of changes, screenshot (if UI changes), and reference any related GitHub issues.

---

## 🎨 Coding Standards

- **PHP**: Follow PSR-12 coding style guidelines. Keep controller methods thin and delegate complex business logic to dedicated Services (`app/Services/`).
- **React / TypeScript**: Use functional components with explicit TypeScript interfaces. Follow modern React 19 standards.
- **Styling**: Use predefined TailwindCSS utility tokens; avoid ad-hoc inline styles.

Thank you for helping make ScholarGate better for schools everywhere! 🚀
