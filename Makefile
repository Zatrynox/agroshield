# Convenience targets. Docker is the only requirement for the stack targets;
# Node/pnpm are required for the quality targets.
#
# Windows users without make can use the equivalent `pnpm stack:*` scripts.

NODE ?= node

.PHONY: help install up down reset logs ps seed simulate dev dev-down prod prod-down verify \
	typecheck test build lint check scan secrets images

help:
	@echo "make install     Install workspace dependencies"
	@echo "make check       Typecheck, test and build every package"
	@echo "make up          Build and start the local demo stack (http://localhost:8080)"
	@echo "make down        Stop the local stack"
	@echo "make reset       Stop the local stack and delete its volumes"
	@echo "make logs        Follow local stack logs"
	@echo "make ps          Show local stack status"
	@echo "make seed        Re-run the local demo seed"
	@echo "make simulate    Send one round of signed demo readings"
	@echo "make dev         Start the hot-reload development stack"
	@echo "make prod        Deploy the production stack from infra/env/prod.env"
	@echo "make verify      Verify Docker, hello-world and every Compose file"
	@echo "make scan        Scan the working tree and local images"

install:
	pnpm install --frozen-lockfile

up:
	$(NODE) scripts/stack.mjs local:up

down:
	$(NODE) scripts/stack.mjs local:down

reset:
	$(NODE) scripts/stack.mjs local:reset

logs:
	$(NODE) scripts/stack.mjs local:logs

ps:
	$(NODE) scripts/stack.mjs local:ps

seed:
	$(NODE) scripts/stack.mjs local:seed

simulate:
	$(NODE) scripts/stack.mjs local:simulate

dev:
	$(NODE) scripts/stack.mjs dev:up

dev-down:
	$(NODE) scripts/stack.mjs dev:down

prod:
	$(NODE) scripts/stack.mjs prod:up

prod-down:
	$(NODE) scripts/stack.mjs prod:down

verify:
	$(NODE) scripts/stack.mjs verify

typecheck:
	pnpm typecheck

test:
	pnpm test

build:
	pnpm build

lint:
	pnpm lint

check: typecheck test build
	$(NODE) scripts/validate-infra.mjs

scan:
	$(NODE) scripts/scan.mjs all

secrets:
	$(NODE) scripts/scan.mjs secrets

images:
	$(NODE) scripts/scan.mjs images
