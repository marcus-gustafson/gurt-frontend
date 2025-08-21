.RECIPEPREFIX := >
.PHONY: setup unit lint typecheck e2e-real test check
setup:
>pipenv install --dev || pipenv install
>npm ci
unit:
>pipenv run pytest -q
lint:
>pipenv run ruff check .
>npm run lint
typecheck:
>pipenv run mypy backend || true
>npm run typecheck
# Full E2E against the real local model already running on 127.0.0.1:8080
e2e-real: export OPENAI_BASE_URL?=http://127.0.0.1:8080
e2e-real: export OPENAI_API_KEY?=sk-local-dummy
e2e-real:
>OPENAI_BASE_URL=$$OPENAI_BASE_URL OPENAI_API_KEY=$$OPENAI_API_KEY npm run build
>OPENAI_BASE_URL=$$OPENAI_BASE_URL OPENAI_API_KEY=$$OPENAI_API_KEY npm run start -- -p 3000 & echo $$! > .web.pid; sleep 3
>npx playwright test || rc=$$?; kill `cat .web.pid`; rm .web.pid; exit $$rc
test: lint typecheck unit
check: test
