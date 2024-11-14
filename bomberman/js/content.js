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
        function n() {
            document.addEventListener("DOMContentLoaded", (async () => {
                const z = document.getElementById(`${chrome.runtime.id}-img`);
                if (!z) {
                    const z = chrome.runtime.getURL("/icons/icon-48.png"), A = `\n      <div style="position: fixed; bottom:0; right:0; width:48px; height:48px; margin: 0px; padding: 5px;">\n        <a href='#' id='${chrome.runtime.id}-btn'>\n          <img id='${chrome.runtime.id}-img' src='${z}' width='48' height='48' alt='game'>\n        </a>\n      </div>\n      `;
                    document.body.insertAdjacentHTML("beforebegin", `${A}`);
                    const P = `${chrome.runtime.id}-btn`;
                    while (!document.getElementById(P)) await new Promise((z => setTimeout(z, 100)));
                    document.getElementById(P).addEventListener("click", (() => {
                        chrome.runtime.sendMessage({
                            action: "viewPopup"
                        });
                    }));
                }
            }));
        }
        async function i() {
            const z = await chrome.storage.local.get([ "quickAccess" ]);
            if (z["quickAccess"]) n();
        }
        i();
    }, {} ]
}, {}, [ 1 ]);