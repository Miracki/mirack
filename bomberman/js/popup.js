function SHORTEN_PATH(z, A) {
    while (z.path.length > A) z.path.shift();
    return z;
}

function InjectAI(z) {
    return z.isAI = true, {
        player: z,
        isAI: true,
        isRisky: false,
        LastPos: {
            x: -1,
            y: -1
        },
        NotMovingCount: 0,
        SafePathMode: false,
        NotMoving: function() {
            var z = this.player.PositionFoot();
            return this.LastPos.x == z.x && this.LastPos.y == z.y;
        },
        IsAIDeadLock: function() {
            if (this.player.AIPlan == null) return false;
            var z = this.player.CellOnFoot(), A = MAP.CellPosToXY(this.player.AIPlan.x, this.player.AIPlan.y);
            if (MAP.BombsMatrix[A.y][A.x] != null && A.x != z.x && A.y != z.y) return true;
            for (var P = [ {
                x: 0,
                y: 0
            }, {
                x: 1,
                y: 0
            }, {
                x: -1,
                y: 0
            }, {
                x: 0,
                y: 1
            }, {
                x: 0,
                y: -1
            } ], n = 0; n < P.length; n++) if (z.x + P[n].x == A.x && z.y + P[n].y == A.y) return false;
            return true;
        },
        IsDanger: function() {
            var z = this.player.AIPlan != null ? this.player.AIPlan : null;
            if (z != null) {
                var A = MAP._CellPosToXY(z);
                return this.BombDanger(this.player.CellOnFoot()) || this.BombDanger(A) || MAP.ExplosionMatrix[A.y][A.x] != null;
            } else return this.BombDanger(this.player.CellOnFoot());
        },
        NumberOfBombsHorAndVer: function() {
            for (var z = this.player.CellOnFoot(), A = {
                x: z.x,
                y: z.y
            }, P = 0, n = 1; true; n++) {
                var i = A.x + n, O = A.y;
                if (!MAP.IsFloor(i, O)) break;
                if (MAP.BombsMatrix[O][i] != null) P++;
            }
            for (var n = 1; true; n++) {
                var i = A.x - n, O = A.y;
                if (!MAP.IsFloor(i, O)) break;
                if (MAP.BombsMatrix[O][i] != null) P++;
            }
            for (var n = 1; true; n++) {
                var i = A.x, O = A.y + n;
                if (!MAP.IsFloor(i, O)) break;
                if (MAP.BombsMatrix[O][i] != null) P++;
            }
            for (var n = 1; true; n++) {
                var i = A.x, O = A.y - n;
                if (!MAP.IsFloor(i, O)) break;
                if (MAP.BombsMatrix[O][i] != null) P++;
            }
            return P;
        },
        Update: function() {
            if (this.player.dead || GAME.Paused) return;
            var z = MAP.MapStatusEnum, A = PlayerGen.PlayerKeyEnum;
            if (this.IsAIDeadLock()) this.player.AIPlan = null, this.player.SetCenterCell(),
            this.player.AIStack = this.SafePath(); else if (this.NotMoving()) {
                if (this.NotMovingCount++ >= 10 && this.IsDanger()) this.player.AIStack.path = [],
                this.player.AIPlan = null, this.NotMovingCount = 0;
            } else this.LastPos = this.player.PositionFoot(), this.NotMovingCount = 0;
            if (this.IsEnemyClose() && this.NumberOfBombsHorAndVer() < 3) {
                var P = this.player.CellOnFoot(), n = {
                    x: P.x,
                    y: P.y,
                    bomb: {
                        range: this.player.BombRange
                    }
                }, i = this.__SafePathNoPoisonTile(n);
                if (i.ok && (this.isRisky || this.NoOfDifferentBombsDangerOnPath(i.path) == 0)) this.player.SetBomb();
            }
            if (this.IsDanger() && this.player.AIStack.type != AI_STACK_TYPE.DODGE) this.player.AIStack = this.SafePath(),
            this.player.AIPlan = null; else if (this.player.AIStack.path.length == 0 && this.player.AIPlan == null) if (this.IsDanger()) this.player.AIStack = this.SafePath(); else {
                var O = this.GetRndTargetsArr(), t = null;
                if (O.length != 0) {
                    if (Math.random() <= .02) t = this.PathToWall(); else {
                        for (var k = 0; k < O.length; k++) if (t = this.PathFinder(GAME.Players[O[k]].CellOnFoot()),
                        t.ok) break;
                        if (!t.ok) t = this.PathToWall();
                    }
                    this.player.AIStack = t;
                } else this.player.AIStack = this.SafePath(), this.player.AIPlan = null;
            }
            if (this.player.AIStack.type != AI_STACK_TYPE.DODGE && this.player.AIStack.type != AI_STACK_TYPE.PICKUP) {
                var t = this.PathToGoodPickUp();
                if (t.ok && t.path.length < 5) this.player.AIStack = t;
            }
            if (this.IsBlockClose() && this.player.AIStack.type != AI_STACK_TYPE.DODGE && this.player.AIStack.type != AI_STACK_TYPE.PICKUP && this.NumberOfBombsHorAndVer() == 0) {
                var P = this.player.CellOnFoot(), n = {
                    x: P.x,
                    y: P.y,
                    bomb: {
                        range: this.player.BombRange
                    }
                }, d = this.SafePath(n);
                if (d.ok && this.NoOfDifferentBombsDangerOnPath(d.path) == 0) if (this.__SafePathNoPoisonTile(n).ok) this.player.SetBomb();
            }
        },
        GetRndTargetsArr: function() {
            for (var z = [], A = [], P = Math.floor(Math.random() * GAME.NumberOfPlayers), n = 0; n < GAME.NumberOfPlayers; n++) z.push((P + n) % GAME.NumberOfPlayers);
            for (var n = 0; n < z.length; n++) if (GAME.Players[z[n]].id != this.player.id && !GAME.Players[z[n]].dead) A.push(z[n]);
            return A;
        },
        BombNextToTileAt: function(z, A) {
            if (!MAP.IsWall(z, A)) return false;
            return MAP.BombsMatrix[A + 1][z] != null || MAP.BombsMatrix[A - 1][z] != null || MAP.BombsMatrix[A][z + 1] != null || MAP.BombsMatrix[A][z - 1] != null;
        },
        NoOfDifferentBombsDangerOnPath: function(z) {
            for (var A = this.getBombsArr(), P = 0, n = new Array(A.length), i = 0; i < n.length; i++) n[i] = false;
            for (var i = 0; i < z.length; i++) for (var O = 0; O < A.length; O++) {
                if (n[O]) continue;
                if (this.EmulateBombDanger(z[i], A[O])) n[O] = true, P++;
            }
            return P;
        },
        IsBlockClose: function() {
            for (var z = [ {
                x: 1,
                y: 0
            }, {
                x: -1,
                y: 0
            }, {
                x: 0,
                y: 1
            }, {
                x: 0,
                y: -1
            } ], A = this.player.CellOnFoot(), P = 0; P < z.length; P++) {
                var n = MAP.PowerUpMatrix[A.y + z[P].y][A.x + z[P].x];
                if (MAP.IsWall(A.x + z[P].x, A.y + z[P].y)) return true; else if (n != null && n.type == MAP.PowerUpEnum.PENALTY) return true;
            }
            return false;
        },
        IsEnemyClose: function() {
            for (var z = [ {
                x: 0,
                y: 0
            }, {
                x: 1,
                y: 0
            }, {
                x: -1,
                y: 0
            }, {
                x: 0,
                y: 1
            }, {
                x: 0,
                y: -1
            } ], A = this.player.CellOnFoot(), P = 0; P < GAME.NumberOfPlayers; P++) if (GAME.Players[P].id != this.player.id && !GAME.Players[P].dead) {
                var n = {
                    x: A.x,
                    y: A.y,
                    bomb: {
                        range: this.player.BombRange - 1
                    }
                };
                if (this.EmulateBombDanger(GAME.Players[P].CellOnFoot(), n)) return true;
            }
            return false;
        },
        __SafePathNoPoisonTile: function(z) {
            z = typeof z !== "undefined" ? z : {
                x: -1e3,
                y: -1e3,
                range: 0
            };
            for (var A = this.player.CellOnFoot(), P = [ {
                x: A.x,
                y: A.y,
                prev: null,
                len: 0
            } ], n = MAP.Get2DArray(MAP.MapY, MAP.MapX), i = 0; i < MAP.MapY; i++) for (var O = 0; O < MAP.MapX; O++) n[i][O] = false;
            n[A.y][A.x] = true;
            var t = null, k = null, d = false, Q = [], B = MAP.PowerUpMatrix;
            while (P.length != 0) {
                var w = P.shift();
                if (k = w, !this.BombDanger(w, z) && (z.x != w.x || z.y != w.y) && (B[w.y][w.x] == null || B[w.y][w.x] != null && B[w.y][w.x].type != MAP.PowerUpEnum.PENALTY)) {
                    t = w, d = true;
                    break;
                }
                if (MAP.IsFloor(w.x + 1, w.y) && !n[w.y][w.x + 1] && MAP.BombsMatrix[w.y][w.x + 1] == null && MAP.ExplosionMatrix[w.y][w.x + 1] == null && (z.x != w.x + 1 || z.y != w.y) && (B[w.y][w.x + 1] == null || B[w.y][w.x + 1] != null && B[w.y][w.x + 1].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x + 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y][w.x + 1] = true;
                if (MAP.IsFloor(w.x - 1, w.y) && !n[w.y][w.x - 1] && MAP.BombsMatrix[w.y][w.x - 1] == null && MAP.ExplosionMatrix[w.y][w.x - 1] == null && (z.x != w.x - 1 || z.y != w.y) && (B[w.y][w.x - 1] == null || B[w.y][w.x - 1] != null && B[w.y][w.x - 1].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x - 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y][w.x - 1] = true;
                if (MAP.IsFloor(w.x, w.y + 1) && !n[w.y + 1][w.x] && MAP.BombsMatrix[w.y + 1][w.x] == null && MAP.ExplosionMatrix[w.y + 1][w.x] == null && (z.x != w.x || z.y != w.y + 1) && (B[w.y + 1][w.x] == null || B[w.y + 1][w.x] != null && B[w.y + 1][w.x].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x,
                    y: w.y + 1,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y + 1][w.x] = true;
                if (MAP.IsFloor(w.x, w.y - 1) && !n[w.y - 1][w.x] && MAP.BombsMatrix[w.y - 1][w.x] == null && MAP.ExplosionMatrix[w.y - 1][w.x] == null && (z.x != w.x || z.y != w.y - 1) && (B[w.y - 1][w.x] == null || B[w.y - 1][w.x] != null && B[w.y - 1][w.x].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x,
                    y: w.y - 1,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y - 1][w.x] = true;
            }
            if (t == null) t = k;
            while (t != null) Q.push(t), t = t.prev;
            return {
                path: Q,
                ok: d,
                type: AI_STACK_TYPE.DODGE
            };
        },
        SafePath: function(z) {
            var A = this.__SafePathNoPoisonTile(z);
            if (A.ok) return A;
            z = typeof z !== "undefined" ? z : {
                x: -1e3,
                y: -1e3,
                range: 0
            };
            for (var P = this.player.CellOnFoot(), n = [ {
                x: P.x,
                y: P.y,
                prev: null,
                len: 0
            } ], i = MAP.Get2DArray(MAP.MapY, MAP.MapX), O = 0; O < MAP.MapY; O++) for (var t = 0; t < MAP.MapX; t++) i[O][t] = false;
            i[P.y][P.x] = true;
            var k = null, d = null, Q = false, B = [];
            while (n.length != 0) {
                var w = n.shift();
                if (d = w, !this.BombDanger(w, z) && (z.x != w.x || z.y != w.y)) {
                    k = w, Q = true;
                    break;
                }
                if (MAP.IsFloor(w.x + 1, w.y) && !i[w.y][w.x + 1] && MAP.BombsMatrix[w.y][w.x + 1] == null && MAP.ExplosionMatrix[w.y][w.x + 1] == null && (z.x != w.x + 1 || z.y != w.y)) n.push({
                    x: w.x + 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), i[w.y][w.x + 1] = true;
                if (MAP.IsFloor(w.x - 1, w.y) && !i[w.y][w.x - 1] && MAP.BombsMatrix[w.y][w.x - 1] == null && MAP.ExplosionMatrix[w.y][w.x - 1] == null && (z.x != w.x - 1 || z.y != w.y)) n.push({
                    x: w.x - 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), i[w.y][w.x - 1] = true;
                if (MAP.IsFloor(w.x, w.y + 1) && !i[w.y + 1][w.x] && MAP.BombsMatrix[w.y + 1][w.x] == null && MAP.ExplosionMatrix[w.y + 1][w.x] == null && (z.x != w.x || z.y != w.y + 1)) n.push({
                    x: w.x,
                    y: w.y + 1,
                    prev: w,
                    len: 1 + w.len
                }), i[w.y + 1][w.x] = true;
                if (MAP.IsFloor(w.x, w.y - 1) && !i[w.y - 1][w.x] && MAP.BombsMatrix[w.y - 1][w.x] == null && MAP.ExplosionMatrix[w.y - 1][w.x] == null && (z.x != w.x || z.y != w.y - 1)) n.push({
                    x: w.x,
                    y: w.y - 1,
                    prev: w,
                    len: 1 + w.len
                }), i[w.y - 1][w.x] = true;
            }
            if (k == null) k = d;
            while (k != null) B.push(k), k = k.prev;
            return {
                path: B,
                ok: Q,
                type: AI_STACK_TYPE.DODGE
            };
        },
        BombDanger: function(z, A) {
            var P = this.getBombsArr();
            if (typeof A !== "undefined") if (A.x > -1 && A.y > -1) P.push(A);
            if (P.length == 0) return false;
            for (var n = 0; n < P.length; n++) if (this.EmulateBombDanger(z, P[n])) return true;
            return false;
        },
        EmulateBombDanger: function(z, A) {
            for (var P = A, n = z, i = {
                x: A.x,
                y: A.y
            }, O = 0; O < P.bomb.range; O++) {
                var t = i.x + O, k = i.y;
                if (!MAP.IsFloor(t, k)) break;
                if (n.x == t && n.y == k) return true;
            }
            for (var O = 0; O < P.bomb.range; O++) {
                var t = i.x - O, k = i.y;
                if (!MAP.IsFloor(t, k)) break;
                if (n.x == t && n.y == k) return true;
            }
            for (var O = 0; O < P.bomb.range; O++) {
                var t = i.x, k = i.y + O;
                if (!MAP.IsFloor(t, k)) break;
                if (n.x == t && n.y == k) return true;
            }
            for (var O = 0; O < P.bomb.range; O++) {
                var t = i.x, k = i.y - O;
                if (!MAP.IsFloor(t, k)) break;
                if (n.x == t && n.y == k) return true;
            }
            return false;
        },
        PathFinder: function(z) {
            for (var A = this.player.CellOnFoot(), P = [ {
                x: A.x,
                y: A.y,
                prev: null,
                len: 0
            } ], n = MAP.Get2DArray(MAP.MapY, MAP.MapX), i = 0; i < MAP.MapY; i++) for (var O = 0; O < MAP.MapX; O++) n[i][O] = false;
            n[A.y][A.x] = true;
            var t = null, k = null, d = false, Q = [], B = MAP.PowerUpMatrix;
            while (P.length != 0) {
                var w = P.shift(), a = false;
                if (w.x == z.x && w.y == z.y) {
                    t = w, d = true;
                    break;
                }
                if (MAP.IsFloor(w.x + 1, w.y) && !n[w.y][w.x + 1] && !this.BombDanger({
                    x: w.x + 1,
                    y: w.y
                }) && (B[w.y][w.x + 1] == null || B[w.y][w.x + 1] != null && B[w.y][w.x + 1].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x + 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y][w.x + 1] = true, a = true;
                if (MAP.IsFloor(w.x - 1, w.y) && !n[w.y][w.x - 1] && !this.BombDanger({
                    x: w.x - 1,
                    y: w.y
                }) && (B[w.y][w.x - 1] == null || B[w.y][w.x - 1] != null && B[w.y][w.x - 1].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x - 1,
                    y: w.y,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y][w.x - 1] = true, a = true;
                if (MAP.IsFloor(w.x, w.y + 1) && !n[w.y + 1][w.x] && !this.BombDanger({
                    x: w.x,
                    y: w.y + 1
                }) && (B[w.y + 1][w.x] == null || B[w.y + 1][w.x] != null && B[w.y + 1][w.x].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x,
                    y: w.y + 1,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y + 1][w.x] = true, a = true;
                if (MAP.IsFloor(w.x, w.y - 1) && !n[w.y - 1][w.x] && !this.BombDanger({
                    x: w.x,
                    y: w.y - 1
                }) && (B[w.y - 1][w.x] == null || B[w.y - 1][w.x] != null && B[w.y - 1][w.x].type != MAP.PowerUpEnum.PENALTY)) P.push({
                    x: w.x,
                    y: w.y - 1,
                    prev: w,
                    len: 1 + w.len
                }), n[w.y - 1][w.x] = true, a = true;
                if (!a && k == null) k = w;
            }
            if (t == null) t = k;
            while (t != null) Q.push(t), t = t.prev;
            return {
                path: Q,
                ok: d,
                type: AI_STACK_TYPE.FOLLOW
            };
        },
        PathToGoodPickUp: function() {
            for (var z = this.player.CellOnFoot(), A = [ {
                x: z.x,
                y: z.y,
                prev: null,
                len: 0
            } ], P = MAP.Get2DArray(MAP.MapY, MAP.MapX), n = 0; n < MAP.MapY; n++) for (var i = 0; i < MAP.MapX; i++) P[n][i] = false;
            P[z.y][z.x] = true;
            var O = null, t = null, k = false, d = [], Q = MAP.PowerUpMatrix;
            while (A.length != 0) {
                var B = A.shift(), w = false;
                if (Q[B.y][B.x] != null && Q[B.y][B.x].type != MAP.PowerUpEnum.PENALTY) {
                    O = B, k = true;
                    break;
                }
                if (MAP.IsFloor(B.x + 1, B.y) && !P[B.y][B.x + 1] && !this.BombDanger({
                    x: B.x + 1,
                    y: B.y
                }) && (Q[B.y][B.x + 1] == null || Q[B.y][B.x + 1] != null && Q[B.y][B.x + 1].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x + 1,
                    y: B.y,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y][B.x + 1] = true, w = true;
                if (MAP.IsFloor(B.x - 1, B.y) && !P[B.y][B.x - 1] && !this.BombDanger({
                    x: B.x - 1,
                    y: B.y
                }) && (Q[B.y][B.x - 1] == null || Q[B.y][B.x - 1] != null && Q[B.y][B.x - 1].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x - 1,
                    y: B.y,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y][B.x - 1] = true, w = true;
                if (MAP.IsFloor(B.x, B.y + 1) && !P[B.y + 1][B.x] && !this.BombDanger({
                    x: B.x,
                    y: B.y + 1
                }) && (Q[B.y + 1][B.x] == null || Q[B.y + 1][B.x] != null && Q[B.y + 1][B.x].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x,
                    y: B.y + 1,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y + 1][B.x] = true, w = true;
                if (MAP.IsFloor(B.x, B.y - 1) && !P[B.y - 1][B.x] && !this.BombDanger({
                    x: B.x,
                    y: B.y - 1
                }) && (Q[B.y - 1][B.x] == null || Q[B.y - 1][B.x] != null && Q[B.y - 1][B.x].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x,
                    y: B.y - 1,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y - 1][B.x] = true, w = true;
                if (!w && t == null) t = B;
            }
            if (O == null) O = t;
            while (O != null) d.push(O), O = O.prev;
            return {
                path: d,
                ok: k,
                type: AI_STACK_TYPE.PICKUP
            };
        },
        PathToWall: function() {
            for (var z = this.player.CellOnFoot(), A = [ {
                x: z.x,
                y: z.y,
                prev: null,
                len: 0
            } ], P = MAP.Get2DArray(MAP.MapY, MAP.MapX), n = 0; n < MAP.MapY; n++) for (var i = 0; i < MAP.MapX; i++) P[n][i] = false;
            P[z.y][z.x] = true;
            var O = null, t = null, k = false, d = [], Q = MAP.PowerUpMatrix;
            while (A.length != 0) {
                var B = A.shift(), w = false;
                if ((MAP.IsWall(B.x - 1, B.y) || MAP.IsWall(B.x + 1, B.y) || MAP.IsWall(B.x, B.y - 1) || MAP.IsWall(B.x, B.y + 1)) && (Q[B.y][B.x] == null || Q[B.y][B.x] != null && Q[B.y][B.x].type != MAP.PowerUpEnum.PENALTY)) if (!this.BombNextToTileAt(B.x + 1, B.y) && !this.BombNextToTileAt(B.x - 1, B.y) && !this.BombNextToTileAt(B.x, B.y + 1) && !this.BombNextToTileAt(B.x, B.y - 1)) {
                    O = B, k = true;
                    break;
                }
                if (MAP.IsFloor(B.x + 1, B.y) && !P[B.y][B.x + 1] && !this.BombDanger({
                    x: B.x + 1,
                    y: B.y
                }) && (Q[B.y][B.x + 1] == null || Q[B.y][B.x + 1] != null && Q[B.y][B.x + 1].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x + 1,
                    y: B.y,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y][B.x + 1] = true, w = true;
                if (MAP.IsFloor(B.x - 1, B.y) && !P[B.y][B.x - 1] && !this.BombDanger({
                    x: B.x - 1,
                    y: B.y
                }) && (Q[B.y][B.x - 1] == null || Q[B.y][B.x - 1] != null && Q[B.y][B.x - 1].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x - 1,
                    y: B.y,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y][B.x - 1] = true, w = true;
                if (MAP.IsFloor(B.x, B.y + 1) && !P[B.y + 1][B.x] && !this.BombDanger({
                    x: B.x,
                    y: B.y + 1
                }) && (Q[B.y + 1][B.x] == null || Q[B.y + 1][B.x] != null && Q[B.y + 1][B.x].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x,
                    y: B.y + 1,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y + 1][B.x] = true, w = true;
                if (MAP.IsFloor(B.x, B.y - 1) && !P[B.y - 1][B.x] && !this.BombDanger({
                    x: B.x,
                    y: B.y - 1
                }) && (Q[B.y - 1][B.x] == null || Q[B.y - 1][B.x] != null && Q[B.y - 1][B.x].type != MAP.PowerUpEnum.PENALTY)) A.push({
                    x: B.x,
                    y: B.y - 1,
                    prev: B,
                    len: 1 + B.len
                }), P[B.y - 1][B.x] = true, w = true;
                if (!w && t == null) t = B;
            }
            if (O == null) O = t;
            while (O != null) d.push(O), O = O.prev;
            return {
                path: d,
                ok: k,
                type: AI_STACK_TYPE.FOLLOW
            };
        },
        getBombsArr: function() {
            for (var z = [], A = 0; A < MAP.MapY; A++) for (var P = 0; P < MAP.MapX; P++) if (MAP.BombsMatrix[A][P] != null) z.push({
                bomb: MAP.BombsMatrix[A][P],
                x: P,
                y: A
            });
            return z;
        }
    };
}

function GetBomb(z, A, P) {
    return {
        x: z,
        y: A,
        RootPlayer: P,
        range: P.BombRange,
        IntervalHandle: null,
        SoundHandle: null,
        frames: [ 0, 1, 0, 2 ],
        frameIdx: 0,
        explodeMs: 3e3,
        exploded: false,
        Sound: null,
        SoundPlayed: false,
        TimerHandle: null,
        Activate: function() {
            this.RootPlayer.MaxBombs--, this.Sound = new Audio("../audio/bomb.mp3"), this.Sound.volume = .3;
            var z = this;
            this.IntervalHandle = setInterval((function() {
                if (z.TimerHandle != null) if (GAME.Paused) {
                    if (z.TimerHandle.On()) z.TimerHandle.pause();
                    return;
                } else if (!z.TimerHandle.On()) z.TimerHandle.resume();
                z.frameIdx = (z.frameIdx + 1) % z.frames.length;
            }), 500), this.SoundHandle = setInterval((function() {
                if (z.TimerHandle != null) if (GAME.Paused) {
                    if (z.TimerHandle.On()) z.TimerHandle.pause();
                    return;
                } else if (!z.TimerHandle.On()) z.TimerHandle.resume();
                if (z.exploded && !z.SoundPlayed) z.Sound.play(), z.SoundPlayed = true;
            }), 50), this.TimerHandle = new Timer((function() {
                if (clearInterval(z.IntervalHandle), clearInterval(z.SoundHandle), z.RootPlayer.MaxBombs++,
                z.exploded = true, !z.SoundPlayed) z.Sound.play(), z.SoundPlayed = true;
            }), z.explodeMs);
        },
        Render: function() {
            MAP.Ctx.drawImage(GAME.SpriteBankImage, 154 + this.frames[this.frameIdx] * 16, 204, 15, 16, MAP.TileDim * this.x + MAP.TileDim * .15, MAP.TileDim * this.y + MAP.TileDim * .15, MAP.TileDim * .7, MAP.TileDim * .7);
        },
        GetExplosion: function() {
            return GetExplosion(this.x, this.y, this.range);
        }
    };
}

function GetExplosion(z, A, P) {
    return {
        x: z,
        y: A,
        range: P,
        over: false,
        frameIdx: 0,
        frames: [ 3, 2, 1, 0, 1, 2, 3 ],
        IntervalHandle: null,
        durationMs: 500,
        maxX: 0,
        minX: 0,
        maxY: 0,
        minY: 0,
        maxXW: false,
        minXW: false,
        maxYW: false,
        minYW: false,
        cleaningDone: false,
        TimerHandle: null,
        Activate: function() {
            var z = this;
            this.IntervalHandle = setInterval((function() {
                if (z.TimerHandle != null) if (GAME.Paused) {
                    if (z.TimerHandle.On()) z.TimerHandle.pause();
                    return;
                } else if (!z.TimerHandle.On()) z.TimerHandle.resume();
                if (z.frameIdx++, z.frameIdx == z.frames.length) z.frameIdx = 0;
            }), 72), this.TimerHandle = new Timer((function() {
                z.CleanUpExplosionMatrix(), clearInterval(z.IntervalHandle), z.over = true;
            }), z.durationMs);
        },
        BasicRender: function() {
            MAP.Ctx.drawImage(GAME.SpriteBankImage, 74 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * this.x, MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            for (var z = 1; true; z++) {
                if (this.minY == 0) break;
                if (this.y - z == this.minY) {
                    if (this.minYW) MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y - z), MAP.TileDim, MAP.TileDim); else MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y - z), MAP.TileDim, MAP.TileDim);
                    break;
                } else MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y - z), MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; true; z++) {
                if (this.maxY == 0) break;
                if (this.y + z == this.maxY) {
                    if (this.maxYW) MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y + z), MAP.TileDim, MAP.TileDim); else MAP.Ctx.drawImage(GAME.SpriteBankImage, 138 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y + z), MAP.TileDim, MAP.TileDim);
                    break;
                } else MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y + z), MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; true; z++) {
                if (this.minX == 0) break;
                if (this.x - z == this.minX) {
                    if (this.minXW) MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x - z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim); else MAP.Ctx.drawImage(GAME.SpriteBankImage, 202 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * (this.x - z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
                    break;
                } else MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x - z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; true; z++) {
                if (this.maxX == 0) break;
                if (this.x + z == this.maxX) {
                    if (this.maxXW) MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x + z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim); else MAP.Ctx.drawImage(GAME.SpriteBankImage, 74 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * (this.x + z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
                    break;
                } else MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x + z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            }
        },
        CleanUpExplosionMatrix: function() {
            MAP.ExplosionMatrix[this.y][this.x] = null;
            for (var z = 0; true; z++) {
                if (this.minY == 0) break;
                if (MAP.ExplosionMatrix[this.y - z][this.x] = null, this.y - z == this.minY) break;
            }
            for (var z = 0; true; z++) {
                if (this.maxY == 0) break;
                if (MAP.ExplosionMatrix[this.y + z][this.x] = null, this.y + z == this.maxY) break;
            }
            for (var z = 0; true; z++) {
                if (this.minX == 0) break;
                if (MAP.ExplosionMatrix[this.y][this.x - z] = null, this.x - z == this.minX) break;
            }
            for (var z = 0; true; z++) {
                if (this.maxX == 0) break;
                if (MAP.ExplosionMatrix[this.y][this.x + z] = null, this.x + z == this.maxX) break;
            }
        },
        Render: function() {
            if (this.cleaningDone) return void this.BasicRender();
            MAP.ExplosionMatrix[this.y][this.x] = 1, MAP.Ctx.drawImage(GAME.SpriteBankImage, 74 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * this.x, MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            for (var z = 1; z < this.range; z++) {
                if (!MAP.IsFloor(this.x, this.y - z)) {
                    if (MAP.IsWall(this.x, this.y - z)) MAP.Map[this.y - z][this.x] = MAP.MapStatusEnum.FLOOR,
                    MAP.WallDestroyRenderMatrix[this.y - z][this.x] = GetAnimatedWall(this.x, this.y - z),
                    MAP.WallDestroyRenderMatrix[this.y - z][this.x].Activate();
                    this.minYW = true;
                    break;
                }
                if (this.minY = this.y - z, MAP.ExplosionMatrix[this.y - z][this.x] = 1, z + 1 >= this.range) {
                    MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y - z), MAP.TileDim, MAP.TileDim);
                    break;
                }
                MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y - z), MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; z < this.range; z++) {
                if (!MAP.IsFloor(this.x, this.y + z)) {
                    if (MAP.IsWall(this.x, this.y + z)) MAP.Map[this.y + z][this.x] = MAP.MapStatusEnum.FLOOR,
                    MAP.WallDestroyRenderMatrix[this.y + z][this.x] = GetAnimatedWall(this.x, this.y + z),
                    MAP.WallDestroyRenderMatrix[this.y + z][this.x].Activate();
                    this.maxYW = true;
                    break;
                }
                if (this.maxY = this.y + z, MAP.ExplosionMatrix[this.y + z][this.x] = 1, z + 1 >= this.range) {
                    MAP.Ctx.drawImage(GAME.SpriteBankImage, 138 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y + z), MAP.TileDim, MAP.TileDim);
                    break;
                }
                MAP.Ctx.drawImage(GAME.SpriteBankImage, 266 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * this.x, MAP.TileDim * (this.y + z), MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; z < this.range; z++) {
                if (!MAP.IsFloor(this.x - z, this.y)) {
                    if (MAP.IsWall(this.x - z, this.y)) MAP.Map[this.y][this.x - z] = MAP.MapStatusEnum.FLOOR,
                    MAP.WallDestroyRenderMatrix[this.y][this.x - z] = GetAnimatedWall(this.x - z, this.y),
                    MAP.WallDestroyRenderMatrix[this.y][this.x - z].Activate();
                    this.minXW = true;
                    break;
                }
                if (this.minX = this.x - z, MAP.ExplosionMatrix[this.y][this.x - z] = 1, z + 1 >= this.range) {
                    MAP.Ctx.drawImage(GAME.SpriteBankImage, 202 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * (this.x - z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
                    break;
                }
                MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x - z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            }
            for (var z = 1; z < this.range; z++) {
                if (!MAP.IsFloor(this.x + z, this.y)) {
                    if (MAP.IsWall(this.x + z, this.y)) MAP.Map[this.y][this.x + z] = MAP.MapStatusEnum.FLOOR,
                    MAP.WallDestroyRenderMatrix[this.y][this.x + z] = GetAnimatedWall(this.x + z, this.y),
                    MAP.WallDestroyRenderMatrix[this.y][this.x + z].Activate();
                    this.maxXW = true;
                    break;
                }
                if (this.maxX = this.x + z, MAP.ExplosionMatrix[this.y][this.x + z] = 1, z + 1 >= this.range) {
                    MAP.Ctx.drawImage(GAME.SpriteBankImage, 74 + this.frames[this.frameIdx] * 16, 221, 16, 16, MAP.TileDim * (this.x + z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
                    break;
                }
                MAP.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.frames[this.frameIdx] * 16, 237, 16, 16, MAP.TileDim * (this.x + z), MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
            }
            this.cleaningDone = true;
        }
    };
}

AI_STACK_TYPE = Object.freeze({
    FOLLOW: 1,
    DODGE: 2,
    PICKUP: 3
});

var GAME = {
    SpriteBankImage: null,
    Players: [],
    Paused: false,
    BackgroundAudio: null,
    EngineIntervalHandle: null,
    EndGameHandle: null,
    AILogicHandle: null,
    AISettings: null,
    AI: [],
    NumberOfPlayers: 4,
    Init: function() {
        this.AISettings = GetAISettings(), this.PrepareSpritesAndInitMap(), this.PrepareAudio();
    },
    PrepareAudio: function() {
        this.BackgroundAudio = new Audio("../audio/background2.mp3"), this.BackgroundAudio.play(),
        this.BackgroundAudio.loop = true, this.BackgroundAudio.volume = .1;
    },
    PrepareSpritesAndInitMap: function() {
        this.SpriteBankImage = new Image;
        var z = this, A = document.getElementById("ctx"), P = A.getContext("2d");
        this.SpriteBankImage.onload = function() {
            MAP.Init(A, P), z.EngineStart();
        }, this.SpriteBankImage.src = "../sprites/players.png";
    },
    generateContext: function(z, A) {
        var P = document.createElement("canvas");
        return P.width = z, P.height = A, P.getContext("2d");
    },
    PlayersInit: function(z) {
        for (var A = (MAP.MapX - 2) * MAP.TileDim, P = (MAP.MapY - 2) * MAP.TileDim, n = 1 * MAP.TileDim, i = 1 * MAP.TileDim, O = [ [ n, i ], [ A, P ], [ A, i ], [ n, P ] ], t = 0; t < z && t < 4; t++) this.Players.push(PlayerGen.CreatePlayer(O[t][0], O[t][1], t)),
        this.Players[t].SetCenterCell();
    },
    RenderPause: function(z) {
        MAP.Ctx.fillStyle = "rgba(0, 0, 0, 0.8)", MAP.Ctx.fillRect(0, 0, MAP.Canvas.width, MAP.Canvas.height),
        MAP.Ctx.font = "52px Consolas", MAP.Ctx.fillStyle = "white";
        var A = MAP.Ctx.measureText(z);
        MAP.Ctx.fillText(z, MAP.Canvas.width / 2 - A.width / 2, MAP.Canvas.height / 2);
    },
    ResetBombSoundsPrevGame: function() {
        for (var z = 0; z < MAP.MapY; z++) for (var A = 0; A < MAP.MapX; A++) if (MAP.BombsMatrix[z][A] != null && MAP.BombsMatrix[z][A].SoundHandle != null) clearInterval(MAP.BombsMatrix[z][A].SoundHandle),
        MAP.BombsMatrix[z][A].SoundPlayed = true;
    },
    ResetEngine: function() {
        if (this.ResetBombSoundsPrevGame(), clearInterval(this.EngineIntervalHandle), clearInterval(this.AILogicHandle),
        this.EngineIntervalHandle = null, this.EndGameHandle != null) this.EndGameHandle.pause();
        this.EndGameHandle = null, this.BackgroundAudio.src = "", this.BackgroundAudio = null,
        this.BackgroundAudio = null, this.SpriteBankImage = null, this.AI = [], this.Players = [],
        this.Paused = false, this.Init();
    },
    PauseGame: function(z) {
        var A = document.getElementById("ctx");
        if (this.EndGameHandle != null || A.style.display == "none" && z != "controlReq") return;
        if (this.Paused = !this.Paused, this.Paused) {
            if (this.AISettings = GetAISettings(), this.RenderPause("GAME PAUSED"), this.BackgroundAudio != null) this.BackgroundAudio.pause();
        } else {
            for (var P = GetAISettings(), n = 0; n < P.length; n++) if (P[n].AI != this.AISettings[n].AI || P[n].Smart != this.AISettings[n].Smart) return void this.ResetEngine();
            this.BackgroundAudio.play();
        }
    },
    OpenCloseControls: function() {
        this.PauseGame("controlReq");
        var z = document.getElementById("table-container"), A = document.getElementById("ctx");
        if (this.Paused) z.style.display = ""; else z.style.display = "none";
    },
    EngineStart: function() {
        this.PlayersInit(this.NumberOfPlayers);
        var z = this;
        document.onkeydown = function(A) {
            for (var P = 0; P < z.Players.length; P++) {
                if (z.Paused || z.Players[P].isAI || z.Players[P].dead) continue;
                z.Players[P].TryKeyDown(A.keyCode);
            }
        }, document.onkeyup = function(A) {
            if (A.keyCode == 80) z.PauseGame();
            if (A.keyCode == 82) z.ResetEngine();
            if (A.keyCode == 67) z.OpenCloseControls();
            for (var P = 0; P < z.Players.length; P++) {
                if (z.Paused || z.Players[P].isAI || z.Players[P].dead) continue;
                z.Players[P].TryKeyUp(A.keyCode);
            }
        };
        for (var A = 0; A < this.NumberOfPlayers; A++) if (this.AISettings[A].AI) {
            var P = InjectAI(this.Players[A]);
            P.isRisky = !this.AISettings[A].Smart, this.AI.push(P);
        }
        this.AILogicHandle = setInterval((function() {
            for (var A = 0; A < z.AI.length; A++) z.AI[A].Update();
        }), 10), this.EngineIntervalHandle = setInterval((function() {
            if (z.Paused) return;
            MAP.InitRenderBasicMap(), MAP.RenderBombs();
            for (var A = 0, P = 0; P < z.Players.length; P++) if (!z.Players[P].dead) z.Players[P].Update(),
            A++;
            if (A < 2 && z.EndGameHandle == null) {
                var n = [ "WHITE", "GREEN", "RED", "BLUE" ];
                z.EndGameHandle = new Timer((function() {
                    clearInterval(z.EngineIntervalHandle), MAP.InitRenderBasicMap(), MAP.RenderBombs();
                    for (var A = -1, P = 0; P < z.Players.length; P++) if (!z.Players[P].dead) z.Players[P].Update(),
                    A = P;
                    if (A != -1) z.Players[A].Update();
                    if (A == -1) z.RenderPause("DRAW GAME!"); else z.RenderPause(n[A] + " PLAYER WINS!");
                }), 3e3);
            }
        }), 1e3 / 60);
    }
}, KEYBOARD_MAP = [ "", "", "", "CANCEL", "", "", "HELP", "", "BACK_SPACE", "TAB", "", "", "CLEAR", "ENTER", "RETURN", "", "SHIFT", "CONTROL", "ALT", "PAUSE", "CAPS_LOCK", "KANA", "EISU", "JUNJA", "FINAL", "HANJA", "", "ESCAPE", "CONVERT", "NONCONVERT", "ACCEPT", "MODECHANGE", "SPACE", "PAGE_UP", "PAGE_DOWN", "END", "HOME", "LEFT", "UP", "RIGHT", "DOWN", "SELECT", "PRINT", "EXECUTE", "PRINTSCREEN", "INSERT", "DELETE", "", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "COLON", "SEMICOLON", "LESS_THAN", "EQUALS", "GREATER_THAN", "QUESTION_MARK", "AT", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "WIN", "", "CONTEXT_MENU", "", "SLEEP", "NUMPAD0", "NUMPAD1", "NUMPAD2", "NUMPAD3", "NUMPAD4", "NUMPAD5", "NUMPAD6", "NUMPAD7", "NUMPAD8", "NUMPAD9", "MULTIPLY", "ADD", "SEPARATOR", "SUBTRACT", "DECIMAL", "DIVIDE", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "", "", "", "", "", "", "", "", "NUM_LOCK", "SCROLL_LOCK", "WIN_OEM_FJ_JISHO", "WIN_OEM_FJ_MASSHOU", "WIN_OEM_FJ_TOUROKU", "WIN_OEM_FJ_LOYA", "WIN_OEM_FJ_ROYA", "", "", "", "", "", "", "", "", "", "CIRCUMFLEX", "EXCLAMATION", "DOUBLE_QUOTE", "HASH", "DOLLAR", "PERCENT", "AMPERSAND", "UNDERSCORE", "OPEN_PAREN", "CLOSE_PAREN", "ASTERISK", "PLUS", "PIPE", "HYPHEN_MINUS", "OPEN_CURLY_BRACKET", "CLOSE_CURLY_BRACKET", "TILDE", "", "", "", "", "VOLUME_MUTE", "VOLUME_DOWN", "VOLUME_UP", "", "", "SEMICOLON", "EQUALS", "COMMA", "MINUS", "PERIOD", "SLASH", "BACK_QUOTE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "OPEN_BRACKET", "BACK_SLASH", "CLOSE_BRACKET", "QUOTE", "", "META", "ALTGR", "", "WIN_ICO_HELP", "WIN_ICO_00", "", "WIN_ICO_CLEAR", "", "", "WIN_OEM_RESET", "WIN_OEM_JUMP", "WIN_OEM_PA1", "WIN_OEM_PA2", "WIN_OEM_PA3", "WIN_OEM_WSCTRL", "WIN_OEM_CUSEL", "WIN_OEM_ATTN", "WIN_OEM_FINISH", "WIN_OEM_COPY", "WIN_OEM_AUTO", "WIN_OEM_ENLW", "WIN_OEM_BACKTAB", "ATTN", "CRSEL", "EXSEL", "EREOF", "PLAY", "ZOOM", "", "PA1", "WIN_OEM_CLEAR", "" ];

function ShowKey(z, A, P, n) {
    var i = n.keyCode;
    P.value = KEYBOARD_MAP[i], n.preventDefault(), PlayerGen.KEYS[z][A] = i;
}

function MaxP(z) {
    GAME.NumberOfPlayers = z, GAME.ResetEngine(), GAME.Paused = true, GAME.OpenCloseControls();
}

function GetAISettings() {
    for (var z = [], A = 0; A < 4; A++) z.push({
        AI: document.getElementById("player" + A + "AI").checked,
        Smart: document.getElementById("player" + A + "AI_MODE").checked
    });
    return z;
}

window.onload = function() {
    GAME.Init();
};

var MAP = {
    Canvas: null,
    Ctx: null,
    MapY: 15,
    MapX: 15,
    Map: null,
    TileDim: 50,
    BombsMatrix: null,
    ExplosionMatrix: null,
    ExplosionRenderMatrix: null,
    WallDestroyRenderMatrix: null,
    PowerUpMatrix: null,
    PreDefinedPowerUpLocations: null,
    MapStatusEnum: Object.freeze({
        SOLID_BORDER: 1,
        SOLID_WALL: 2,
        WALL: 3,
        FLOOR: 4
    }),
    PowerUpEnum: Object.freeze({
        RANGE: 0,
        BOMB: 1,
        SPEED: 3,
        PENALTY: 8
    }),
    IsFloor: function(z, A) {
        return this.Map[A][z] == this.MapStatusEnum.FLOOR;
    },
    IsWall: function(z, A) {
        return this.Map[A][z] == this.MapStatusEnum.WALL;
    },
    Get2DArray: function(z, A) {
        for (var P = new Array(z), n = 0; n < z; n++) P[n] = new Array(A);
        return P;
    },
    GetBoundingCells: function(z, A) {
        for (var P = this, n = [], i = -1; i <= 1; i++) for (var O = -1; O <= 1; O++) if (z + i < 0 || A + i < 0) n.push({
            Walkable: false,
            Collides: function(z, A) {
                return true;
            }
        }); else n.push({
            Walkable: this.Map[A + i][z + O] == this.MapStatusEnum.FLOOR || this.Map[A + i][z + O] == this.MapStatusEnum.WALL && false,
            _j: O,
            _i: i,
            Collides: function(n, i) {
                return (z + this._j) * P.TileDim <= n && n <= (z + this._j + 1) * P.TileDim && (A + this._i) * P.TileDim <= i && i <= (A + this._i + 1) * P.TileDim;
            }
        });
        return n;
    },
    GetCellXY: function(z, A) {
        return {
            x: z * this.TileDim,
            y: A * this.TileDim
        };
    },
    CellPosToXY: function(z, A) {
        return {
            x: Math.floor(z / this.TileDim),
            y: Math.floor(A / this.TileDim)
        };
    },
    _CellPosToXY: function(z) {
        return {
            x: Math.floor(z.x / this.TileDim),
            y: Math.floor(z.y / this.TileDim)
        };
    },
    Init: function(z, A) {
        this.Canvas = z, this.Ctx = A, this.InitPrepareMap(), this.InitRenderBasicMap();
    },
    SetRender: function(z, A, P) {
        switch (z) {
          case this.MapStatusEnum.SOLID_BORDER:
            this.Ctx.drawImage(GAME.SpriteBankImage, 0 + 16 * 3 + .2, 170, 16, 16, this.TileDim * P, this.TileDim * A, this.TileDim, this.TileDim);
            break;

          case this.MapStatusEnum.SOLID_WALL:
            this.Ctx.drawImage(GAME.SpriteBankImage, 0 + 16 * 4, 170, 16, 16, this.TileDim * P, this.TileDim * A, this.TileDim, this.TileDim);
            break;

          case this.MapStatusEnum.WALL:
            this.Ctx.drawImage(GAME.SpriteBankImage, 0 + 16 * 2, 170, 16, 16, this.TileDim * P, this.TileDim * A, this.TileDim, this.TileDim);
            break;

          case this.MapStatusEnum.FLOOR:
            this.Ctx.drawImage(GAME.SpriteBankImage, 0 + 16 * 0, 170, 16, 16, this.TileDim * P, this.TileDim * A, this.TileDim, this.TileDim);
            break;

          default:
            return false;
        }
        return true;
    },
    InitPrepareMap: function() {
        this.Canvas.width = this.TileDim * (this.MapX + 0), this.Canvas.height = this.TileDim * (this.MapY + 0),
        this.Map = this.Get2DArray(this.MapY, this.MapX), this.BombsMatrix = this.Get2DArray(this.MapY, this.MapX),
        this.ExplosionMatrix = this.Get2DArray(this.MapY, this.MapX), this.ExplosionRenderMatrix = this.Get2DArray(this.MapY, this.MapX),
        this.WallDestroyRenderMatrix = this.Get2DArray(this.MapY, this.MapX), this.PowerUpMatrix = this.Get2DArray(this.MapY, this.MapX),
        this.PreDefinedPowerUpLocations = this.Get2DArray(this.MapY, this.MapX);
        for (var z = 0; z < this.MapY; z++) for (var A = 0; A < this.MapX; A++) {
            this.BombsMatrix[z][A] = null, this.ExplosionMatrix[z][A] = null, this.ExplosionRenderMatrix[z][A] = null,
            this.WallDestroyRenderMatrix[z][A] = null, this.PowerUpMatrix[z][A] = null, this.PreDefinedPowerUpLocations[z][A] = null;
            var P = Math.random();
            if (z == 0 || z == this.MapY - 1 || A == 0 || A == this.MapX - 1) this.Map[z][A] = this.MapStatusEnum.SOLID_BORDER; else if (A % 2 == 0 && z % 2 == 0) this.Map[z][A] = this.MapStatusEnum.SOLID_WALL; else if (P <= .7) {
                if (this.Map[z][A] = this.MapStatusEnum.WALL, Math.random() <= .4) {
                    var n = [ 0, 1, 0, 1, 0, 1, 3, 8 ], i = n[Math.floor(Math.random() * n.length)];
                    this.PreDefinedPowerUpLocations[z][A] = i;
                }
            } else this.Map[z][A] = this.MapStatusEnum.FLOOR;
        }
        this.InitPrepareMapForPlayerStart();
    },
    InitPrepareMapForPlayerStart: function() {
        this.Map[0 + 1][0 + 1] = this.MapStatusEnum.FLOOR, this.Map[0 + 1][1 + 1] = this.MapStatusEnum.FLOOR,
        this.Map[1 + 1][0 + 1] = this.MapStatusEnum.FLOOR, this.Map[0 + 1][this.MapX - 1 - 1] = this.MapStatusEnum.FLOOR,
        this.Map[1 + 1][this.MapX - 1 - 1] = this.MapStatusEnum.FLOOR, this.Map[0 + 1][this.MapX - 2 - 1] = this.MapStatusEnum.FLOOR,
        this.Map[this.MapY - 2][0 + 1] = this.MapStatusEnum.FLOOR, this.Map[this.MapY - 2][1 + 1] = this.MapStatusEnum.FLOOR,
        this.Map[this.MapY - 3][0 + 1] = this.MapStatusEnum.FLOOR, this.Map[this.MapY - 2][this.MapX - 2] = this.MapStatusEnum.FLOOR,
        this.Map[this.MapY - 2 - 1][this.MapX - 2] = this.MapStatusEnum.FLOOR, this.Map[this.MapY - 2][this.MapX - 2 - 1] = this.MapStatusEnum.FLOOR;
    },
    InitRenderBasicMap: function() {
        for (var z = 0; z < this.MapY; z++) for (var A = 0; A < this.MapX; A++) this.SetRender(this.Map[z][A], z, A);
    },
    RenderBombs: function() {
        for (var z = 0; z < this.MapY; z++) for (var A = 0; A < this.MapX; A++) {
            if (this.PowerUpMatrix[z][A] != null) this.PowerUpMatrix[z][A].Render();
            if (this.BombsMatrix[z][A] != null) if (this.BombsMatrix[z][A].exploded) this.ExplosionRenderMatrix[z][A] = this.BombsMatrix[z][A].GetExplosion(),
            this.ExplosionRenderMatrix[z][A].Activate(), this.BombsMatrix[z][A] = null; else if (this.ExplosionMatrix[z][A] != null) this.BombsMatrix[z][A].exploded = true; else this.BombsMatrix[z][A].Render();
            if (this.ExplosionRenderMatrix[z][A] != null) if (this.ExplosionRenderMatrix[z][A].over) this.ExplosionRenderMatrix[z][A] = null; else this.ExplosionRenderMatrix[z][A].Render();
            if (this.WallDestroyRenderMatrix[z][A] != null) if (this.WallDestroyRenderMatrix[z][A].exploded) this.WallDestroyRenderMatrix[z][A] = null; else this.WallDestroyRenderMatrix[z][A].Render();
            if (this.ExplosionMatrix[z][A] != null) {
                if (this.PowerUpMatrix[z][A] != null) this.PowerUpMatrix[z][A] = null;
                for (var P = 0; P < GAME.Players.length; P++) {
                    if (GAME.Players[P].dead) continue;
                    var n = GAME.Players[P].CellOnFoot();
                    if (z == n.y && A == n.x) GAME.Players[P].dead = true, GAME.Players[P].SetDeadAnimation();
                }
            }
        }
        for (var P = 0; P < GAME.Players.length; P++) if (GAME.Players[P].deadAnimation != null) if (!GAME.Players[P].deadAnimation.over) GAME.Players[P].deadAnimation.Render(); else GAME.Players[P].deadAnimation = null;
    }
};

function _GetCenterTile(z) {
    return {
        x: z.x * MAP.TileDim + MAP.TileDim * .5,
        y: z.y * MAP.TileDim + MAP.TileDim * .5
    };
}

var PlayerGen = {
    KEYS: [ [ 38, 40, 37, 39, 32 ], [ 87, 83, 65, 68, 70 ], [ 73, 75, 74, 76, 72 ], [ 104, 101, 100, 102, 13 ] ],
    PlayerMoveEnum: Object.freeze({
        DOWN: 0,
        RIGHT: 1,
        LEFT: 2,
        UP: 3
    }),
    PlayerKeyEnum: Object.freeze({
        DOWN: 1,
        RIGHT: 3,
        LEFT: 2,
        UP: 0,
        BOMB: 4
    }),
    PlayerTypeEnum: Object.freeze({
        WHITE: 1,
        GREEN: 2,
        RED: 3,
        BLUE: 4
    }),
    CreatePlayer: function(z, A, P) {
        var n = this, i = {
            isAI: false,
            x: z,
            y: A,
            MaxBombs: 1,
            id: P,
            BombRange: 2,
            MoveSpeed: 2.5,
            walking: false,
            firstStep: false,
            dead: false,
            walkFrame: [ 2, 0, 1, 0 ],
            walkFrameIdx: 0,
            localTimeStamp: 0,
            Ctx: MAP.Ctx,
            MovingPos: n.PlayerMoveEnum.DOWN,
            frameIdx: 0,
            deadAnimation: null,
            SetDeadAnimation: function() {
                var z = this;
                this.deadAnimation = {
                    x: z.x,
                    y: z.y,
                    pID: z.id,
                    IntervalHandle: null,
                    frames: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ],
                    frameIdx: 0,
                    durationMs: 2e3,
                    over: false,
                    TimerHandle: null,
                    Activate: function() {
                        var z = this;
                        this.IntervalHandle = setInterval((function() {
                            if (z.TimerHandle != null) if (GAME.Paused) {
                                if (z.TimerHandle.On()) z.TimerHandle.pause();
                                return;
                            } else if (!z.TimerHandle.On()) z.TimerHandle.resume();
                            z.frameIdx = (z.frameIdx + 1) % z.frames.length;
                        }), 222), this.TimerHandle = new Timer((function() {
                            clearInterval(z.IntervalHandle), z.over = true;
                        }), z.durationMs);
                    },
                    Render: function() {
                        MAP.Ctx.drawImage(GAME.SpriteBankImage, this.frames[this.frameIdx] * 24 + 10, 283 + 50 * this.pID - 1, 19, 22, this.x, this.y, MAP.TileDim, MAP.TileDim);
                    }
                }, this.deadAnimation.Activate();
            },
            Position: function() {
                return {
                    x: this.x + MAP.TileDim / 2,
                    y: this.y + MAP.TileDim / 2
                };
            },
            PositionFoot: function() {
                return {
                    x: this.x + MAP.TileDim / 2,
                    y: this.y + MAP.TileDim * .85
                };
            },
            GetBoundPoints: function() {
                return [ {
                    x: this.x + MAP.TileDim * .5,
                    y: this.y + MAP.TileDim * .95
                }, {
                    x: this.x + MAP.TileDim * .3,
                    y: this.y + MAP.TileDim * .85
                }, {
                    x: this.x + MAP.TileDim * .7,
                    y: this.y + MAP.TileDim * .85
                }, {
                    x: this.x + MAP.TileDim * .5,
                    y: this.y + MAP.TileDim * .7
                } ];
            },
            CellOn: function() {
                return {
                    x: Math.floor(this.x / MAP.TileDim),
                    y: Math.floor(this.y / MAP.TileDim)
                };
            },
            CellOnFoot: function() {
                var z = this.PositionFoot();
                return {
                    x: Math.floor(z.x / MAP.TileDim),
                    y: Math.floor(z.y / MAP.TileDim)
                };
            },
            CellOnFootOffset: function(z, A) {
                var P = this.PositionFoot();
                return {
                    x: Math.floor((P.x + z) / MAP.TileDim),
                    y: Math.floor((P.y + A) / MAP.TileDim)
                };
            },
            Update: function() {
                if (this.walking) {
                    if (this.localTimeStamp % 7 == 0 || this.firstStep) this.frameIdx = this.walkFrame[this.walkFrameIdx % 4],
                    this.walkFrameIdx++, this.firstStep = false;
                    if (!this.isAI) this.MoveTo(this.MovingPos);
                }
                if (this.isAI) this.MoveToAi(this.MovingPos);
                this.Render(), this.localTimeStamp++;
            },
            Render: function() {
                this.Ctx.drawImage(GAME.SpriteBankImage, 10 + this.MovingPos * 3 * 24 + 24 * this.frameIdx - 2, 259 + 50 * this.id - 1, 22, 24, this.x, this.y, MAP.TileDim, MAP.TileDim);
            },
            MoveDirection: function(z) {
                if (this.MovingPos = z, !this.walking) this.firstStep = true;
                this.walking = true;
            },
            NewPositionCollidesWithMap: function() {
                var z = this.CellOnFoot();
                if (z.x > MAP.MapX - 2 || z.y > MAP.MapY - 2) return true;
                for (var A = MAP.GetBoundingCells(z.x, z.y), P = this.PositionFoot(), n = this.GetBoundPoints(), i = 0; i < A.length; i++) if (!A[i].Walkable) for (var O = 0; O < n.length; O++) if (A[i].Collides(n[O].x, n[O].y)) return true;
                return false;
            },
            NewPositionCollidesWithBomb: function(z) {
                var A = this.CellOnFoot();
                if (MAP.BombsMatrix[A.y][A.x] != null) {
                    if (z == null) return true;
                    if (A.y == z.y && A.x == z.x) return false; else return true;
                }
                return false;
            },
            AIPlan: null,
            AIStack: {
                path: [],
                type: AI_STACK_TYPE.FOLLOW,
                ok: false
            },
            MoveToAi: function(z) {
                if (this.AIPlan == null) {
                    if (this.AIStack.path.length == 0) return;
                    this.AIPlan = _GetCenterTile(this.AIStack.path.pop());
                }
                this.walking = true;
                var A = this.x, P = this.y, i = this.CellOnFoot(), O = MAP.BombsMatrix[i.y][i.x] != null;
                if (!O) i = null;
                var t = this.PositionFoot();
                if (this.AIPlan.x < t.x) {
                    if (t.x - this.MoveSpeed <= this.AIPlan.x) this.SetCenterCell(), this.AIPlan = null; else this.x -= this.MoveSpeed;
                    this.MovingPos = n.PlayerMoveEnum.LEFT;
                } else if (this.AIPlan.x > t.x) {
                    if (t.x + this.MoveSpeed >= this.AIPlan.x) this.SetCenterCell(), this.AIPlan = null; else this.x += this.MoveSpeed;
                    this.MovingPos = n.PlayerMoveEnum.RIGHT;
                } else if (this.AIPlan.y < t.y) {
                    if (t.y - this.MoveSpeed <= this.AIPlan.y) this.SetCenterCell(), this.AIPlan = null; else this.y -= this.MoveSpeed;
                    this.MovingPos = n.PlayerMoveEnum.UP;
                } else if (this.AIPlan.y > t.y) {
                    if (t.y + this.MoveSpeed >= this.AIPlan.y) this.SetCenterCell(), this.AIPlan = null; else this.y += this.MoveSpeed;
                    this.MovingPos = n.PlayerMoveEnum.DOWN;
                } else this.SetCenterCell(), this.AIPlan = null, this.walking = false;
                if (this.NewPositionCollidesWithMap()) this.y = P, this.x = A;
                if (this.NewPositionCollidesWithBomb(i)) this.y = P, this.x = A;
                if (i = this.CellOnFoot(), MAP.PowerUpMatrix[i.y][i.x] != null) this.ConsumePowerUp(i.x, i.y);
            },
            MoveTo: function(z) {
                var A = this.x, P = this.y, i = this.CellOnFoot(), O = MAP.BombsMatrix[i.y][i.x] != null;
                if (!O) i = null;
                switch (z) {
                  case n.PlayerMoveEnum.DOWN:
                    this.y += this.MoveSpeed;
                    break;

                  case n.PlayerMoveEnum.RIGHT:
                    this.x += this.MoveSpeed;
                    break;

                  case n.PlayerMoveEnum.LEFT:
                    this.x -= this.MoveSpeed;
                    break;

                  case n.PlayerMoveEnum.UP:
                    this.y -= this.MoveSpeed;
                    break;
                }
                if (this.NewPositionCollidesWithMap()) this.y = P, this.x = A;
                if (this.NewPositionCollidesWithBomb(i)) this.y = P, this.x = A;
                if (i = this.CellOnFoot(), MAP.PowerUpMatrix[i.y][i.x] != null) this.ConsumePowerUp(i.x, i.y);
            },
            SetCenterCell: function() {
                var z = this.CellOnFoot(), A = {
                    x: z.x * MAP.TileDim + MAP.TileDim * .5,
                    y: z.y * MAP.TileDim + MAP.TileDim * .5
                };
                this.y = A.y - MAP.TileDim * .85, this.x = A.x - MAP.TileDim / 2;
            },
            ConsumePowerUp: function(z, A) {
                var P = MAP.PowerUpMatrix[A][z];
                switch (MAP.PowerUpMatrix[A][z] = null, P.Sound.play(), P.type) {
                  case MAP.PowerUpEnum.RANGE:
                    this.BombRange++;
                    break;

                  case MAP.PowerUpEnum.BOMB:
                    this.MaxBombs++;
                    break;

                  case MAP.PowerUpEnum.SPEED:
                    this.MoveSpeed++;
                    break;

                  case MAP.PowerUpEnum.PENALTY:
                    this.MoveSpeed -= .5;
                    break;
                }
            },
            SetBomb: function() {
                if (this.MaxBombs == 0) return;
                var z = this.CellOnFoot();
                if (MAP.BombsMatrix[z.y][z.x] != null) return;
                var A = GetBomb(z.x, z.y, this);
                MAP.BombsMatrix[z.y][z.x] = A, A.Activate();
            },
            TryKeyDown: function(z) {
                if (z == n.KEYS[this.id][n.PlayerKeyEnum.UP]) this.MoveDirection(n.PlayerMoveEnum.UP); else if (z == n.KEYS[this.id][n.PlayerKeyEnum.LEFT]) this.MoveDirection(n.PlayerMoveEnum.LEFT); else if (z == n.KEYS[this.id][n.PlayerKeyEnum.DOWN]) this.MoveDirection(n.PlayerMoveEnum.DOWN); else if (z == n.KEYS[this.id][n.PlayerKeyEnum.RIGHT]) this.MoveDirection(n.PlayerMoveEnum.RIGHT); else if (z == n.KEYS[this.id][4]) this.SetBomb();
            },
            TryKeyUp: function(z) {
                if (z == n.KEYS[this.id][n.PlayerKeyEnum.UP] && this.MovingPos == n.PlayerMoveEnum.UP) this.walking = false,
                this.frameIdx = 0; else if (z == n.KEYS[this.id][n.PlayerKeyEnum.LEFT] && this.MovingPos == n.PlayerMoveEnum.LEFT) this.walking = false,
                this.frameIdx = 0; else if (z == n.KEYS[this.id][n.PlayerKeyEnum.DOWN] && this.MovingPos == n.PlayerMoveEnum.DOWN) this.walking = false,
                this.frameIdx = 0; else if (z == n.KEYS[this.id][n.PlayerKeyEnum.RIGHT] && this.MovingPos == n.PlayerMoveEnum.RIGHT) this.walking = false,
                this.frameIdx = 0;
            },
            KeyDown: function(z) {
                if (z == n.PlayerKeyEnum.UP) this.MoveDirection(n.PlayerMoveEnum.UP); else if (z == n.PlayerKeyEnum.LEFT) this.MoveDirection(n.PlayerMoveEnum.LEFT); else if (z == n.PlayerKeyEnum.DOWN) this.MoveDirection(n.PlayerMoveEnum.DOWN); else if (z == n.PlayerKeyEnum.RIGHT) this.MoveDirection(n.PlayerMoveEnum.RIGHT); else if (z == n.PlayerKeyEnum.BOMB) this.SetBomb();
            },
            KeyUp: function(z) {
                if (z == n.PlayerKeyEnum.UP && this.MovingPos == n.PlayerMoveEnum.UP) this.walking = false,
                this.frameIdx = 0; else if (z == n.PlayerKeyEnum.LEFT && this.MovingPos == n.PlayerMoveEnum.LEFT) this.walking = false,
                this.frameIdx = 0; else if (z == n.PlayerKeyEnum.DOWN && this.MovingPos == n.PlayerMoveEnum.DOWN) this.walking = false,
                this.frameIdx = 0; else if (z == n.PlayerKeyEnum.RIGHT && this.MovingPos == n.PlayerMoveEnum.RIGHT) this.walking = false,
                this.frameIdx = 0;
            }
        };
        return i;
    }
};

function Timer(z, A) {
    var P, n, i = A, O = false;
    this.pause = function() {
        window.clearTimeout(P), i -= new Date - n, O = false;
    }, this.On = function() {
        return O;
    }, this.resume = function() {
        n = new Date, window.clearTimeout(P), P = window.setTimeout(z, i), O = true;
    }, this.resume();
}

function getVectorAB(z, A) {
    return {
        X: A.X - z.X,
        Y: A.Y - z.Y
    };
}

function Vector2(z, A) {
    return {
        X: z,
        Y: A
    };
}

function CrossProductVec(z, A) {
    return z.X * A.Y - A.X * z.Y;
}

function ScalarVec(z, A) {
    return z.X * A.X + z.Y * A.Y;
}

function VectorAngle(z, A) {
    return Math.acos(ScalarVec(z, A) / (Math.sqrt(ScalarVec(z, z)) * Math.sqrt(ScalarVec(A, A))));
}

function VectorAngleToDeg(z) {
    return z * (180 / Math.PI);
}

function toDeg(z) {
    return z * (180 / Math.PI);
}

function toRad(z) {
    return z * (Math.PI / 180);
}

function getDistance(z, A) {
    return (z.X - A.X) * (z.X - A.X) + (z.Y - A.Y) * (z.Y - A.Y);
}

function getCentroid(z, A, P) {
    return {
        X: (z.X + A.X + P.X) / 3,
        Y: (z.Y + A.Y + P.Y) / 3
    };
}

function getDegAngle(z, A) {
    var P = Math.atan2(A.Y - z.Y, A.X - z.X) * (180 / Math.PI);
    if (P < 0) return P + 360;
    return P;
}

function getRadAngle(z, A) {
    return Math.atan2(A.Y - z.Y, A.X - z.X);
}

function rotateDeg(z, A) {
    var P = A * (Math.PI / 180), n = Math.cos(P), i = Math.sin(P);
    return {
        X: n * z.X - i * z.Y,
        Y: i * z.X + n * z.Y
    };
}

function rotate(z, A) {
    var P = Math.cos(A), n = Math.sin(A);
    return {
        X: P * z.X - n * z.Y,
        Y: n * z.X + P * z.Y
    };
}

function vectorPlus(z, A) {
    return {
        X: z.X + A.X,
        Y: z.Y + A.Y
    };
}

function scaleVector(z, A) {
    return {
        X: z.X * A,
        Y: z.Y * A
    };
}

function getABCArea(z, A, P) {
    return .5 * Math.abs(z.X * (A.Y - P.Y) + A.X * (P.Y - z.Y) + P.X * (z.Y - A.Y));
}

function vecLen(z) {
    return Math.sqrt(z.X * z.X + z.Y * z.Y);
}

function GetAnimatedWall(z, A) {
    return {
        x: z,
        y: A,
        IntervalHandle: null,
        frames: [ 0, 1, 2, 3, 4, 5 ],
        frameIdx: 0,
        durationMs: 500,
        exploded: false,
        TimerHandle: null,
        Activate: function() {
            var z = this;
            this.IntervalHandle = setInterval((function() {
                if (z.TimerHandle != null) if (GAME.Paused) {
                    if (z.TimerHandle.On()) z.TimerHandle.pause();
                    return;
                } else if (!z.TimerHandle.On()) z.TimerHandle.resume();
                z.frameIdx = (z.frameIdx + 1) % z.frames.length;
            }), 83), this.TimerHandle = new Timer((function() {
                clearInterval(z.IntervalHandle), z.exploded = true;
                var A = GeneratePowerUp(z.x, z.y);
                if (A != null) MAP.PowerUpMatrix[z.y][z.x] = A;
            }), z.durationMs);
        },
        Render: function() {
            MAP.Ctx.drawImage(GAME.SpriteBankImage, 58 + this.frames[this.frameIdx] * 16, 205, 16, 16, MAP.TileDim * this.x, MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
        }
    };
}

function GeneratePowerUp(z, A) {
    if (MAP.PreDefinedPowerUpLocations[A][z] == null) return null;
    var P = {
        x: z,
        y: A,
        Sound: null,
        type: MAP.PreDefinedPowerUpLocations[A][z],
        Init: function() {
            this.Sound = new Audio("../audio/powerup.mp3"), this.Sound.volume = .3;
        },
        Render: function() {
            MAP.Ctx.drawImage(GAME.SpriteBankImage, this.type * 16, 188, 16, 16, MAP.TileDim * this.x, MAP.TileDim * this.y, MAP.TileDim, MAP.TileDim);
        }
    };
    return P.Init(), P;
}