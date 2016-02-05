SHELL      := /usr/bin/env bash
MOCHA      := node_modules/.bin/mocha --compilers js:mocha-traceur
REPORTER   := spec
ISTANBUL   := node_modules/.bin/istanbul
COVERALLS  := node_modules/.bin/coveralls
GREP       :=
scenario   :=

.PHONY: lint
lint:

.PHONY: encrypt
encrypt:
	@source env.sh && bash bin/encrypt.sh

.PHONY: test-coverage
test-coverage:
	@export DEBUG=*:*,-mocha:* && $(MOCHA) --recursive \
    test
	@$(ISTANBUL) report text-summary lcov
	@cat coverage/lcov.info | $(COVERALLS) || true

.PHONY: test
test:
	@DEBUG=*:*,-mocha:* $(MOCHA) --reporter $(REPORTER) test/ --grep "$(GREP)"

.PHONY: test-acceptance
test-acceptance:
	@./test/acceptance.sh $(scenario)

.PHONY: save-acceptance-fixtures
save-acceptance-fixtures:
	@source env.sh && env SAVE_FIXTURES=true ./test/acceptance.sh $(scenario)

.PHONY: test-full
test-full: test-coverage test-acceptance
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
