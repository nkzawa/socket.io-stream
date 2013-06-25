
REPORTER = dot

build:
	@./node_modules/.bin/browserify index.js -s ss > bundle.js
	@./node_modules/.bin/uglifyjs bundle.js --comments > socket.io-stream.js
	@rm -f bundle.js

test: test-unit test-acceptance

test-unit:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-acceptance:
	@./node_modules/.bin/mocha --reporter $(REPORTER) --bail\
		test/acceptance/*.js

test-browser: build
	@node ./test/browser/index.js

clean:
	find ./test -name "*.tmp" -exec rm {} +

.PHONY: build test test-unit test-acceptance test-browser clean
