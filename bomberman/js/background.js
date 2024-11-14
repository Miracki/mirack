(function() {
    function z(A, P, n) {
        function i(t, k) {
            if (!P[t]) {
                if (!A[t]) {
                    var d = "function" == typeof require && require;
                    if (!k && d) return d(t, !0);
                    if (O) return O(t, !0);
                    var Q = new Error("Cannot find module '" + t + "'");
                    throw Q.code = "MODULE_NOT_FOUND", Q;
                }
                var B = P[t] = {
                    exports: {}
                };
                A[t][0].call(B.exports, (function(z) {
                    var P = A[t][1][z];
                    return i(P || z);
                }), B, B.exports, z, A, P, n);
            }
            return P[t].exports;
        }
        for (var O = "function" == typeof require && require, t = 0; t < n.length; t++) i(n[t]);
        return i;
    }
    return z;
})()({
    1: [ function(z, A, P) {
        "use strict";
        var n = void 0 && (void 0).__importDefault || function(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        };
        Object.defineProperty(P, "__esModule", {
            value: true
        });
        const i = z("tD"), O = n(z("ub"));
        class t {
            constructor(z) {
                this.popupWidth = z.width, this.popupHeight = z.height;
            }
            init() {
                t.addOnInstalledListener(), chrome.runtime.onMessage.addListener(this.onMessage.bind(this)),
                this.addOnClickActionListener();
            }
            static addOnInstalledListener() {
                chrome.runtime.onInstalled.addListener((async z => {
                    if (z.reason === chrome.runtime.OnInstalledReason.INSTALL) {
                        const z = await chrome.tabs.query({});
                        for (const A of z) try {
                            if (A.id) await chrome.scripting.executeScript({
                                target: {
                                    tabId: A.id
                                },
                                files: [ "js/contentScript.js" ]
                            });
                        } catch (z) {}
                    }
                }));
            }
            async onMessage(z, A, P) {
                if (z.action === "viewPopup") this.openPopup();
            }
            static async getPopupWindows() {
                const z = [], A = chrome.runtime.id, P = await chrome.windows.getAll({
                    populate: true
                });
                for (const n of P) if (n.type === "popup" && n.tabs) {
                    let P = false;
                    for (const z of n.tabs) if (z.url && z.url.includes(`chrome-extension://${A}`) && z.url.includes("popup.html")) P = true;
                    if (P) z.push(n);
                }
                return z;
            }
            static async showPopupWindow(z) {
                let A = z;
                if (!A) A = await t.getPopupWindows();
                A.forEach((z => {
                    const {id: A} = z;
                    if (A) chrome.windows.update(A, {
                        state: "normal",
                        focused: true
                    });
                }));
            }
            async calculatePopupShift() {
                const z = {
                    leftShift: 0,
                    topShift: 0
                }, A = await chrome.windows.getCurrent();
                if (A) z.leftShift = A.width ? A.width / 2 - this.popupWidth / 2 : 0, z.topShift = A.height ? A.height / 2 - this.popupHeight / 2 : 0;
                return z;
            }
            addOnClickActionListener() {
                chrome.action.onClicked.addListener((async () => {
                    await this.openPopup();
                }));
            }
            async openPopup() {
                const z = await t.getPopupWindows();
                let A = false;
                if (z.length > 0) A = true;
                if (A) t.showPopupWindow(z); else {
                    const z = await this.calculatePopupShift();
                    chrome.windows.create({
                        url: chrome.runtime.getURL("html/popup.html"),
                        type: "popup",
                        width: this.popupWidth,
                        height: this.popupHeight,
                        left: Math.round(z.leftShift),
                        top: Math.round(z.topShift),
                        focused: true
                    });
                }
            }
        }
        const k = {
            width: i.popupWidth,
            height: i.popupHeight
        }, d = new t(k);
        d.init(), (0, O.default)("G-SN5LQ77KXT", "KRSYLAUvRkOQWGCpIyDrfw");
    }, {
        ub: 3,
        tD: 2
    } ],
    2: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.popupHeight = P.popupWidth = void 0, P.popupWidth = 530, P.popupHeight = 640;
    }, {} ],
    3: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        const n = z("uuid");
        async function i() {
            const z = await new Promise((z => {
                chrome.storage.local.get([ "cid" ], (A => {
                    z(A);
                }));
            }));
            let {cid: A} = z;
            if (!A) A = (0, n.v4)(), chrome.storage.local.set({
                cid: A
            });
            return A;
        }
        async function O() {
            const z = await new Promise((z => {
                chrome.storage.session.get([ "sid" ], (A => {
                    z(A);
                }));
            }));
            let {sid: A} = z;
            if (!A) A = (0, n.v4)(), chrome.storage.session.set({
                sid: A
            });
            return A;
        }
        async function t(z, A, P, n, i) {
            const O = {
                api_secret: n,
                measurement_id: i
            }, t = {
                user_id: A,
                client_id: A,
                events: [ {
                    name: z,
                    params: {
                        session_id: P
                    }
                } ]
            }, k = `https://www.google-analytics.com/mp/collect?${new URLSearchParams(O).toString()}`;
            await fetch(k, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(t)
            });
        }
        async function k(z, A) {
            chrome.runtime.onInstalled.addListener((async P => {
                if (P.reason === "install") {
                    const P = await i(), n = await O();
                    await t("first_open", P, n, A, z);
                }
            }));
            const P = await i(), n = await O();
            if (await t("tutorial_begin", P, n, A, z), chrome.alarms) chrome.alarms.create("ga4", {
                periodInMinutes: 60 * 24
            });
        }
        P.default = k;
    }, {
        uuid: 4
    } ],
    4: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), Object.defineProperty(P, "NIL", {
            enumerable: true,
            get: function() {
                return k.default;
            }
        }), Object.defineProperty(P, "parse", {
            enumerable: true,
            get: function() {
                return w.default;
            }
        }), Object.defineProperty(P, "stringify", {
            enumerable: true,
            get: function() {
                return B.default;
            }
        }), Object.defineProperty(P, "v1", {
            enumerable: true,
            get: function() {
                return n.default;
            }
        }), Object.defineProperty(P, "v3", {
            enumerable: true,
            get: function() {
                return i.default;
            }
        }), Object.defineProperty(P, "v4", {
            enumerable: true,
            get: function() {
                return O.default;
            }
        }), Object.defineProperty(P, "v5", {
            enumerable: true,
            get: function() {
                return t.default;
            }
        }), Object.defineProperty(P, "validate", {
            enumerable: true,
            get: function() {
                return Q.default;
            }
        }), Object.defineProperty(P, "version", {
            enumerable: true,
            get: function() {
                return d.default;
            }
        });
        var n = a(z("he")), i = a(z("VQ")), O = a(z("eW")), t = a(z("VR")), k = a(z("kp")), d = a(z("pc")), Q = a(z("HL")), B = a(z("mq")), w = a(z("Bg"));
        function a(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
    }, {
        kp: 7,
        Bg: 8,
        mq: 12,
        he: 13,
        VQ: 14,
        eW: 16,
        VR: 17,
        HL: 18,
        pc: 19
    } ],
    5: [ function(z, A, P) {
        "use strict";
        function n(z) {
            if (typeof z === "string") {
                const A = unescape(encodeURIComponent(z));
                z = new Uint8Array(A.length);
                for (let P = 0; P < A.length; ++P) z[P] = A.charCodeAt(P);
            }
            return i(t(k(z), z.length * 8));
        }
        function i(z) {
            const A = [], P = z.length * 32, n = "0123456789abcdef";
            for (let i = 0; i < P; i += 8) {
                const P = z[i >> 5] >>> i % 32 & 255, O = parseInt(n.charAt(P >>> 4 & 15) + n.charAt(P & 15), 16);
                A.push(O);
            }
            return A;
        }
        function O(z) {
            return (z + 64 >>> 9 << 4) + 14 + 1;
        }
        function t(z, A) {
            z[A >> 5] |= 128 << A % 32, z[O(A) - 1] = A;
            let P = 1732584193, n = -271733879, i = -1732584194, t = 271733878;
            for (let A = 0; A < z.length; A += 16) {
                const O = P, k = n, Q = i, B = t;
                P = w(P, n, i, t, z[A], 7, -680876936), t = w(t, P, n, i, z[A + 1], 12, -389564586),
                i = w(i, t, P, n, z[A + 2], 17, 606105819), n = w(n, i, t, P, z[A + 3], 22, -1044525330),
                P = w(P, n, i, t, z[A + 4], 7, -176418897), t = w(t, P, n, i, z[A + 5], 12, 1200080426),
                i = w(i, t, P, n, z[A + 6], 17, -1473231341), n = w(n, i, t, P, z[A + 7], 22, -45705983),
                P = w(P, n, i, t, z[A + 8], 7, 1770035416), t = w(t, P, n, i, z[A + 9], 12, -1958414417),
                i = w(i, t, P, n, z[A + 10], 17, -42063), n = w(n, i, t, P, z[A + 11], 22, -1990404162),
                P = w(P, n, i, t, z[A + 12], 7, 1804603682), t = w(t, P, n, i, z[A + 13], 12, -40341101),
                i = w(i, t, P, n, z[A + 14], 17, -1502002290), n = w(n, i, t, P, z[A + 15], 22, 1236535329),
                P = a(P, n, i, t, z[A + 1], 5, -165796510), t = a(t, P, n, i, z[A + 6], 9, -1069501632),
                i = a(i, t, P, n, z[A + 11], 14, 643717713), n = a(n, i, t, P, z[A], 20, -373897302),
                P = a(P, n, i, t, z[A + 5], 5, -701558691), t = a(t, P, n, i, z[A + 10], 9, 38016083),
                i = a(i, t, P, n, z[A + 15], 14, -660478335), n = a(n, i, t, P, z[A + 4], 20, -405537848),
                P = a(P, n, i, t, z[A + 9], 5, 568446438), t = a(t, P, n, i, z[A + 14], 9, -1019803690),
                i = a(i, t, P, n, z[A + 3], 14, -187363961), n = a(n, i, t, P, z[A + 8], 20, 1163531501),
                P = a(P, n, i, t, z[A + 13], 5, -1444681467), t = a(t, P, n, i, z[A + 2], 9, -51403784),
                i = a(i, t, P, n, z[A + 7], 14, 1735328473), n = a(n, i, t, P, z[A + 12], 20, -1926607734),
                P = o(P, n, i, t, z[A + 5], 4, -378558), t = o(t, P, n, i, z[A + 8], 11, -2022574463),
                i = o(i, t, P, n, z[A + 11], 16, 1839030562), n = o(n, i, t, P, z[A + 14], 23, -35309556),
                P = o(P, n, i, t, z[A + 1], 4, -1530992060), t = o(t, P, n, i, z[A + 4], 11, 1272893353),
                i = o(i, t, P, n, z[A + 7], 16, -155497632), n = o(n, i, t, P, z[A + 10], 23, -1094730640),
                P = o(P, n, i, t, z[A + 13], 4, 681279174), t = o(t, P, n, i, z[A], 11, -358537222),
                i = o(i, t, P, n, z[A + 3], 16, -722521979), n = o(n, i, t, P, z[A + 6], 23, 76029189),
                P = o(P, n, i, t, z[A + 9], 4, -640364487), t = o(t, P, n, i, z[A + 12], 11, -421815835),
                i = o(i, t, P, n, z[A + 15], 16, 530742520), n = o(n, i, t, P, z[A + 2], 23, -995338651),
                P = c(P, n, i, t, z[A], 6, -198630844), t = c(t, P, n, i, z[A + 7], 10, 1126891415),
                i = c(i, t, P, n, z[A + 14], 15, -1416354905), n = c(n, i, t, P, z[A + 5], 21, -57434055),
                P = c(P, n, i, t, z[A + 12], 6, 1700485571), t = c(t, P, n, i, z[A + 3], 10, -1894986606),
                i = c(i, t, P, n, z[A + 10], 15, -1051523), n = c(n, i, t, P, z[A + 1], 21, -2054922799),
                P = c(P, n, i, t, z[A + 8], 6, 1873313359), t = c(t, P, n, i, z[A + 15], 10, -30611744),
                i = c(i, t, P, n, z[A + 6], 15, -1560198380), n = c(n, i, t, P, z[A + 13], 21, 1309151649),
                P = c(P, n, i, t, z[A + 4], 6, -145523070), t = c(t, P, n, i, z[A + 11], 10, -1120210379),
                i = c(i, t, P, n, z[A + 2], 15, 718787259), n = c(n, i, t, P, z[A + 9], 21, -343485551),
                P = d(P, O), n = d(n, k), i = d(i, Q), t = d(t, B);
            }
            return [ P, n, i, t ];
        }
        function k(z) {
            if (z.length === 0) return [];
            const A = z.length * 8, P = new Uint32Array(O(A));
            for (let n = 0; n < A; n += 8) P[n >> 5] |= (z[n / 8] & 255) << n % 32;
            return P;
        }
        function d(z, A) {
            const P = (z & 65535) + (A & 65535), n = (z >> 16) + (A >> 16) + (P >> 16);
            return n << 16 | P & 65535;
        }
        function Q(z, A) {
            return z << A | z >>> 32 - A;
        }
        function B(z, A, P, n, i, O) {
            return d(Q(d(d(A, z), d(n, O)), i), P);
        }
        function w(z, A, P, n, i, O, t) {
            return B(A & P | ~A & n, z, A, i, O, t);
        }
        function a(z, A, P, n, i, O, t) {
            return B(A & n | P & ~n, z, A, i, O, t);
        }
        function o(z, A, P, n, i, O, t) {
            return B(A ^ P ^ n, z, A, i, O, t);
        }
        function c(z, A, P, n, i, O, t) {
            return B(P ^ (A | ~n), z, A, i, O, t);
        }
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var L = n;
        P.default = L;
    }, {} ],
    6: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        const n = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
        var i = {
            randomUUID: n
        };
        P.default = i;
    }, {} ],
    7: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = "00000000-0000-0000-0000-000000000000";
        P.default = n;
    }, {} ],
    8: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = i(z("HL"));
        function i(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        function O(z) {
            if (!(0, n.default)(z)) throw TypeError("Invalid UUID");
            let A;
            const P = new Uint8Array(16);
            return P[0] = (A = parseInt(z.slice(0, 8), 16)) >>> 24, P[1] = A >>> 16 & 255, P[2] = A >>> 8 & 255,
            P[3] = A & 255, P[4] = (A = parseInt(z.slice(9, 13), 16)) >>> 8, P[5] = A & 255,
            P[6] = (A = parseInt(z.slice(14, 18), 16)) >>> 8, P[7] = A & 255, P[8] = (A = parseInt(z.slice(19, 23), 16)) >>> 8,
            P[9] = A & 255, P[10] = (A = parseInt(z.slice(24, 36), 16)) / 1099511627776 & 255,
            P[11] = A / 4294967296 & 255, P[12] = A >>> 24 & 255, P[13] = A >>> 16 & 255, P[14] = A >>> 8 & 255,
            P[15] = A & 255, P;
        }
        var t = O;
        P.default = t;
    }, {
        HL: 18
    } ],
    9: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
        P.default = n;
    }, {} ],
    10: [ function(z, A, P) {
        "use strict";
        let n;
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = O;
        const i = new Uint8Array(16);
        function O() {
            if (!n) if (n = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto),
            !n) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
            return n(i);
        }
    }, {} ],
    11: [ function(z, A, P) {
        "use strict";
        function n(z, A, P, n) {
            switch (z) {
              case 0:
                return A & P ^ ~A & n;

              case 1:
                return A ^ P ^ n;

              case 2:
                return A & P ^ A & n ^ P & n;

              case 3:
                return A ^ P ^ n;
            }
        }
        function i(z, A) {
            return z << A | z >>> 32 - A;
        }
        function O(z) {
            const A = [ 1518500249, 1859775393, 2400959708, 3395469782 ], P = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
            if (typeof z === "string") {
                const A = unescape(encodeURIComponent(z));
                z = [];
                for (let P = 0; P < A.length; ++P) z.push(A.charCodeAt(P));
            } else if (!Array.isArray(z)) z = Array.prototype.slice.call(z);
            z.push(128);
            const O = z.length / 4 + 2, t = Math.ceil(O / 16), k = new Array(t);
            for (let A = 0; A < t; ++A) {
                const P = new Uint32Array(16);
                for (let n = 0; n < 16; ++n) P[n] = z[A * 64 + n * 4] << 24 | z[A * 64 + n * 4 + 1] << 16 | z[A * 64 + n * 4 + 2] << 8 | z[A * 64 + n * 4 + 3];
                k[A] = P;
            }
            k[t - 1][14] = (z.length - 1) * 8 / Math.pow(2, 32), k[t - 1][14] = Math.floor(k[t - 1][14]),
            k[t - 1][15] = (z.length - 1) * 8 & 4294967295;
            for (let z = 0; z < t; ++z) {
                const O = new Uint32Array(80);
                for (let A = 0; A < 16; ++A) O[A] = k[z][A];
                for (let z = 16; z < 80; ++z) O[z] = i(O[z - 3] ^ O[z - 8] ^ O[z - 14] ^ O[z - 16], 1);
                let t = P[0], d = P[1], Q = P[2], B = P[3], w = P[4];
                for (let z = 0; z < 80; ++z) {
                    const P = Math.floor(z / 20), k = i(t, 5) + n(P, d, Q, B) + w + A[P] + O[z] >>> 0;
                    w = B, B = Q, Q = i(d, 30) >>> 0, d = t, t = k;
                }
                P[0] = P[0] + t >>> 0, P[1] = P[1] + d >>> 0, P[2] = P[2] + Q >>> 0, P[3] = P[3] + B >>> 0,
                P[4] = P[4] + w >>> 0;
            }
            return [ P[0] >> 24 & 255, P[0] >> 16 & 255, P[0] >> 8 & 255, P[0] & 255, P[1] >> 24 & 255, P[1] >> 16 & 255, P[1] >> 8 & 255, P[1] & 255, P[2] >> 24 & 255, P[2] >> 16 & 255, P[2] >> 8 & 255, P[2] & 255, P[3] >> 24 & 255, P[3] >> 16 & 255, P[3] >> 8 & 255, P[3] & 255, P[4] >> 24 & 255, P[4] >> 16 & 255, P[4] >> 8 & 255, P[4] & 255 ];
        }
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var t = O;
        P.default = t;
    }, {} ],
    12: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0, P.unsafeStringify = t;
        var n = i(z("HL"));
        function i(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        const O = [];
        for (let z = 0; z < 256; ++z) O.push((z + 256).toString(16).slice(1));
        function t(z, A = 0) {
            return (O[z[A + 0]] + O[z[A + 1]] + O[z[A + 2]] + O[z[A + 3]] + "-" + O[z[A + 4]] + O[z[A + 5]] + "-" + O[z[A + 6]] + O[z[A + 7]] + "-" + O[z[A + 8]] + O[z[A + 9]] + "-" + O[z[A + 10]] + O[z[A + 11]] + O[z[A + 12]] + O[z[A + 13]] + O[z[A + 14]] + O[z[A + 15]]).toLowerCase();
        }
        function k(z, A = 0) {
            const P = t(z, A);
            if (!(0, n.default)(P)) throw TypeError("Stringified UUID is invalid");
            return P;
        }
        var d = k;
        P.default = d;
    }, {
        HL: 18
    } ],
    13: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = O(z("ba")), i = z("mq");
        function O(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        let t, k, d = 0, Q = 0;
        function B(z, A, P) {
            let O = A && P || 0;
            const B = A || new Array(16);
            z = z || {};
            let w = z.node || t, a = z.clockseq !== void 0 ? z.clockseq : k;
            if (w == null || a == null) {
                const A = z.random || (z.rng || n.default)();
                if (w == null) w = t = [ A[0] | 1, A[1], A[2], A[3], A[4], A[5] ];
                if (a == null) a = k = (A[6] << 8 | A[7]) & 16383;
            }
            let o = z.msecs !== void 0 ? z.msecs : Date.now(), c = z.nsecs !== void 0 ? z.nsecs : Q + 1;
            const L = o - d + (c - Q) / 1e4;
            if (L < 0 && z.clockseq === void 0) a = a + 1 & 16383;
            if ((L < 0 || o > d) && z.nsecs === void 0) c = 0;
            if (c >= 1e4) throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
            d = o, Q = c, k = a, o += 122192928e5;
            const p = ((o & 268435455) * 1e4 + c) % 4294967296;
            B[O++] = p >>> 24 & 255, B[O++] = p >>> 16 & 255, B[O++] = p >>> 8 & 255, B[O++] = p & 255;
            const I = o / 4294967296 * 1e4 & 268435455;
            B[O++] = I >>> 8 & 255, B[O++] = I & 255, B[O++] = I >>> 24 & 15 | 16, B[O++] = I >>> 16 & 255,
            B[O++] = a >>> 8 | 128, B[O++] = a & 255;
            for (let z = 0; z < 6; ++z) B[O + z] = w[z];
            return A || (0, i.unsafeStringify)(B);
        }
        var w = B;
        P.default = w;
    }, {
        ba: 10,
        mq: 12
    } ],
    14: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = O(z("Vz")), i = O(z("bX"));
        function O(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        const t = (0, n.default)("v3", 48, i.default);
        var k = t;
        P.default = k;
    }, {
        bX: 5,
        Vz: 15
    } ],
    15: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.URL = P.DNS = void 0, P.default = Q;
        var n = z("mq"), i = O(z("Bg"));
        function O(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        function t(z) {
            z = unescape(encodeURIComponent(z));
            const A = [];
            for (let P = 0; P < z.length; ++P) A.push(z.charCodeAt(P));
            return A;
        }
        const k = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
        P.DNS = k;
        const d = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
        function Q(z, A, P) {
            function O(z, O, k, d) {
                var Q;
                if (typeof z === "string") z = t(z);
                if (typeof O === "string") O = (0, i.default)(O);
                if (((Q = O) === null || Q === void 0 ? void 0 : Q.length) !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
                let B = new Uint8Array(16 + z.length);
                if (B.set(O), B.set(z, O.length), B = P(B), B[6] = B[6] & 15 | A, B[8] = B[8] & 63 | 128,
                k) {
                    d = d || 0;
                    for (let z = 0; z < 16; ++z) k[d + z] = B[z];
                    return k;
                }
                return (0, n.unsafeStringify)(B);
            }
            try {
                O.name = z;
            } catch (z) {}
            return O.DNS = k, O.URL = d, O;
        }
        P.URL = d;
    }, {
        Bg: 8,
        mq: 12
    } ],
    16: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = t(z("wQ")), i = t(z("ba")), O = z("mq");
        function t(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        function k(z, A, P) {
            if (n.default.randomUUID && !A && !z) return n.default.randomUUID();
            z = z || {};
            const t = z.random || (z.rng || i.default)();
            if (t[6] = t[6] & 15 | 64, t[8] = t[8] & 63 | 128, A) {
                P = P || 0;
                for (let z = 0; z < 16; ++z) A[P + z] = t[z];
                return A;
            }
            return (0, O.unsafeStringify)(t);
        }
        var d = k;
        P.default = d;
    }, {
        wQ: 6,
        ba: 10,
        mq: 12
    } ],
    17: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = O(z("Vz")), i = O(z("Kz"));
        function O(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        const t = (0, n.default)("v5", 80, i.default);
        var k = t;
        P.default = k;
    }, {
        Kz: 11,
        Vz: 15
    } ],
    18: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = i(z("cT"));
        function i(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        function O(z) {
            return typeof z === "string" && n.default.test(z);
        }
        var t = O;
        P.default = t;
    }, {
        cT: 9
    } ],
    19: [ function(z, A, P) {
        "use strict";
        Object.defineProperty(P, "__esModule", {
            value: true
        }), P.default = void 0;
        var n = i(z("HL"));
        function i(z) {
            return z && z.__esModule ? z : {
                default: z
            };
        }
        function O(z) {
            if (!(0, n.default)(z)) throw TypeError("Invalid UUID");
            return parseInt(z.slice(14, 15), 16);
        }
        var t = O;
        P.default = t;
    }, {
        HL: 18
    } ]
}, {}, [ 1 ]);