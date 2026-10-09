# Защита ветки main

`main` — то, что на сайте https://hitbox.space. Защита нужна, чтобы туда нельзя было запушить мимо `dev`,
стереть её или переписать историю.

## Что защищает

**Правила GitHub** (набор `main`, файл `.github/rulesets/main.json`) — GitHub не примет пуш, если:

- коммит не прошёл «Проверки» (линтер, сборка, юнит-тесты, сквозные). Проверки запускаются при пуше в `dev`,
  поэтому в `main` попадает только то, что уже лежало в `dev` и было зелёным;
- это force-push (`git push --force`) — историю `main` не переписать;
- ветку удаляют.

Правила действуют на всех, и на владельца репозитория тоже: исключений (`bypass_actors`) нет.

**Сборка** (`.github/workflows/pages.yml`, шаг «Коммит есть в dev») — запасной замок: если коммит в `main`
не найден в `dev`, «Проверки» красные и сайт не меняется. Работает и без правил GitHub.

## Как выкладывать теперь

Как и раньше:

```bash
git push origin dev          # дождаться зелёных «Проверок» в Actions
git push origin dev:main     # fast-forward, сайт выкладывается
```

Если пуш в `main` отклонён с `Required status check "Проверки" is expected` — проверки на этом коммите
ещё идут или упали. Дождаться зелёных в Actions (или починить и запушить в `dev` заново) и повторить.

## Включить правила (один раз)

1. GitHub → репозиторий `xrnskew/hitbox` → **Settings** → слева **Rules** → **Rulesets**.
2. **New ruleset** → **Import a ruleset** → выбрать файл `.github/rulesets/main.json`
   (скачать: открыть его на GitHub → **Download raw file**).
3. Проверить, что видно: Enforcement status — **Active**, Target branches — `main`, отмечены
   **Restrict deletions**, **Require status checks to pass** (в списке — `Проверки`, источник GitHub Actions),
   **Block force pushes**.
4. **Create**.

Если **Import** нет — то же руками: **New ruleset** → **New branch ruleset**, имя `main`, Enforcement —
**Active**, **Add target** → **Include by pattern** → `main`, отметить три правила из пункта 3; в
**Require status checks to pass** → **Add checks** → начать вводить `Проверки` → выбрать с GitHub Actions.

Что правила срабатывают, видно в **Settings → Rules → Insights**: там каждый пуш в `main` и пропущен он или
отклонён.
