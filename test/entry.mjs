"use strict";

import * as globals from './globals.mjs';
const { expect,
    // constants,
    agent,
} = globals;

describe('Test the entry handling routes', function () {
    this.slow(1000);

    describe('GET /entry', function () {
        it('should return a 200 OK and a list of entries', function () {
            agent
                .get('/entry')
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                });
        });
    });
});