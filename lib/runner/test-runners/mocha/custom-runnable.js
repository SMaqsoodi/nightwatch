module.exports = async function(fn, isHook = false) {
  let self = this;
  let start = new Date();
  let ctx = this.ctx;
  let finished;

  if (this.isPending()) {
    return fn();
  }

  let emitted;
  if (!isHook) {
    this._enableTimeouts = false;
  }

  // Sometimes the ctx exists, but it is not runnable
  if (ctx && ctx.runnable) {
    ctx.runnable(this);
  }

  // called multiple times
  function multiple(err) {
    if (emitted) {
      return;
    }
    emitted = true;
    let msg = 'done() called multiple times';
    if (err && err.message) {
      err.message += ` (and Mocha's ${msg})`;
      self.emit('error', err);
    } else {
      self.emit('error', new Error(msg));
    }
  }

  // finished
  function done(err) {
    let ms = self.timeout();
    if (self.timedOut) {
      return;
    }

    if (finished) {
      return multiple(err);
    }

    self.clearTimeout();
    self.duration = new Date() - start;
    finished = true;
    if (!err && self.duration > ms && self._enableTimeouts) {
      err = new Error('Timeout of ' + ms +
        'ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.');
    }
    fn(err);
  }

  this.callback = done;

  this.resetTimeout();
  try {
    const args = [this.parent.client.api];
    let userCalled = false;

    const onFinished = function(err) {
      if (err instanceof Error) {
        return done(err);
      }

      if (err) {
        if (Object.prototype.toString.call(err) === '[object Object]') {
          return done(new Error('done() invoked with non-Error: ' +
            JSON.stringify(err)));
        }

        return done(new Error('done() invoked with non-Error: ' + err));
      }

      done();
    };

    const {nightwatchSuite} = this.parent;

    const err = await nightwatchSuite.handleRunnable(this.title, () => {
      if (isHook && this.async === 2) {
        return new Promise((resolve, reject) => {
          args.push(function(err) {
            userCalled = true;

            setTimeout(function() {
              if (err instanceof Error) {
                reject(err);
              } else {
                resolve();
              }
              onFinished(err);
            }, 10);
          });

          this.fn.apply(ctx, args);
        });
      }

      const result = this.fn.apply(ctx, args);

      if (result instanceof Promise) {
        return result;
      }
    });

    if (this.async <= 1) {
      done(err);
      emitted = true;
    }
  } catch (err) {
    done(err);
    emitted = true;
  }
};