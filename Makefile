
REPORTER = dot

build:
	@echo "Building..."
	@./node_modules/.bin/browserify index.js -s ss > bundle.js
	@./node_modules/.bin/uglifyjs bundle.js --comments > socket.io-stream.js
	@rm -f bundle.js

test: test-unit test-acceptance test-browser

test-unit:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-acceptance:
	@./node_modules/.bin/mocha --reporter $(REPORTER) --bail\
		test/acceptance/*.js

test-browser: test-browser-unit

test-browser-unit: build
	@echo "Starting server..."
	@./node_modules/.bin/static test -p 8888 & echo $$! > pid.txt
	@./node_modules/.bin/mocha-phantomjs http://localhost:8888
	@kill -9 `cat pid.txt`
	@rm -f pid.txt

clean:
	find ./test -name "*.tmp" -exec rm {} +

.PHONY: build test test-unit test-acceptance test-browser test-browser-unit clean
