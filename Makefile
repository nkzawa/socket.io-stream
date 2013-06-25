
REPORTER = dot

build:
	@./node_modules/.bin/browserify index.js -s ss > bundle.js
	@./node_modules/.bin/uglifyjs bundle.js --comments > socket.io-stream.js
	@rm -f bundle.js

test:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-browser: build
	@node ./test/browser/index.js

clean:
	@find ./test -name "*.tmp" -exec rm {} +

.PHONY: build test test-browser clean
