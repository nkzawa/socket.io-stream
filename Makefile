
REPORTER = dot

build:
	@./node_modules/.bin/browserify index.js -s ss > socket.io-stream.js

install:
ifeq ($(SOCKETIO_VERSION),)
	@npm install
else
	@npm install --cache-min 999999 socket.io@$(SOCKETIO_VERSION)
	@npm install --cache-min 999999 socket.io-client@$(SOCKETIO_VERSION)
endif

test:
ifeq ($(BROWSER_NAME),)
	@./node_modules/.bin/mocha --reporter $(REPORTER) --require test/support/server.js
else
	@./node_modules/.bin/zuul \
		--browser-name $(BROWSER_NAME) \
		--browser-version $(BROWSER_VERSION) \
		-- test/index.js
endif

test-local:
	@./node_modules/.bin/zuul --local 8888 --disable-tunnel -- test/index.js

.PHONY: build install test
