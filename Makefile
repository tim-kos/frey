SHELL := /usr/bin/env bash

SHELL     := /bin/bash
COFFEE     = node_modules/.bin/coffee
COFFEELINT = node_modules/.bin/coffeelint
MOCHA      = node_modules/.bin/mocha --compilers coffee:coffee-script --require "coffee-script/register"
REPORTER   = spec
ISTANBUL   = node_modules/.bin/istanbul
COVERALLS  = node_modules/coveralls/bin/coveralls.js

.PHONY: lint
lint:
	@[ ! -f coffeelint.json ] && $(COFFEELINT) --makeconfig > coffeelint.json || true
	@$(COFFEELINT) --file ./coffeelint.json src

.PHONY: build
build:
	@make lint || true
	@$(COFFEE) $(CSOPTS) --map --compile --output lib src

.PHONY: test-coverage
test-coverage:
	# https://github.com/benbria/coffee-coverage/blob/master/docs/HOWTO-codeship-and-coveralls.md
	# npm install --save-dev coffee-coverage istanbul coveralls
	export DEBUG=*:*,-mocha:* && mocha --recursive \
	      --compilers coffee:coffee-script/register \
				--require ./coffee-coverage-loader.js \
	      test
	$(ISTANBUL) report text-summary lcov
	cat coverage/lcov.info | $(COVERALLS)

.PHONY: test
test: build
	@DEBUG=*:*,-mocha:* $(MOCHA) --reporter $(REPORTER) test/ --grep "$(GREP)"

.PHONY: test-integration
test-integration:
	@./test/integration.sh

.PHONY: test-save-fixtures
test-save-fixtures:
	@SAVE_FIXTURES=true ./test/integration.sh

.PHONY: test-full
test-full: test-coverage test-integration
	@echo "Okay : )"

.PHONY: release-major
release-major: test
	@npm version major -m "Release %s"
	@git push
	@npm publish

.PHONY: release-minor
release-minor: test
	@npm version minor -m "Release %s"
	@git push
	@npm publish

.PHONY: release-patch
release-patch: test
	@npm version patch -m "Release %s"
	@git push
	@npm publish
