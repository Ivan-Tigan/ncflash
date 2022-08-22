"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "lib_wallet_js";
exports.ids = ["lib_wallet_js"];
exports.modules = {

/***/ "./lib/wallet.js":
/*!***********************!*\
  !*** ./lib/wallet.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"batch_contracts\": () => (/* binding */ batch_contracts),\n/* harmony export */   \"checkIfWalletConnected\": () => (/* binding */ checkIfWalletConnected),\n/* harmony export */   \"connectWallet\": () => (/* binding */ connectWallet),\n/* harmony export */   \"connectWalletNoPopUp\": () => (/* binding */ connectWalletNoPopUp),\n/* harmony export */   \"contract\": () => (/* binding */ contract),\n/* harmony export */   \"disconnectWallet\": () => (/* binding */ disconnectWallet),\n/* harmony export */   \"getActiveAccount\": () => (/* binding */ getActiveAccount),\n/* harmony export */   \"sign\": () => (/* binding */ sign),\n/* harmony export */   \"views\": () => (/* binding */ views)\n/* harmony export */ });\n/* harmony import */ var _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @taquito/taquito */ \"@taquito/taquito\");\n/* harmony import */ var _taquito_taquito__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_taquito_taquito__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _taquito_beacon_wallet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @taquito/beacon-wallet */ \"@taquito/beacon-wallet\");\n/* harmony import */ var _taquito_beacon_wallet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_taquito_beacon_wallet__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _airgap_beacon_sdk__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @airgap/beacon-sdk */ \"@airgap/beacon-sdk\");\n/* harmony import */ var _airgap_beacon_sdk__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_airgap_beacon_sdk__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\n//import config from \"../config\";\n// TODO: Change back to ghostnet or to other testnet address!!!!!!\nconst preferredNetwork = \"ghostnet\";\n// const preferredNetwork = \"mainnet\";\nconst options = {\n    name: \"Reckless\",\n    iconUrl: \"https://tezostaquito.io/img/favicon.png\",\n    preferredNetwork: preferredNetwork\n};\nconst rpcURL = \"https://ghostnet.smartpy.io\";\n// const rpcURL = \"https://mainnet.smartpy.io\";\nconst wallet = new _taquito_beacon_wallet__WEBPACK_IMPORTED_MODULE_1__.BeaconWallet(options);\n//OpKind\nconst getActiveAccount = async ()=>{\n    return {\n        wallet: await wallet.client.getActiveAccount()\n    };\n};\nasync function connectWallet() {\n    let account = await wallet.client.getActiveAccount();\n    if (!account) {\n        await wallet.requestPermissions({\n            network: {\n                type: preferredNetwork\n            }\n        });\n        account = await wallet.client.getActiveAccount();\n    }\n    return {\n        success: true,\n        wallet: account.address,\n        pk: account.publicKey\n    };\n}\n;\nasync function connectWalletNoPopUp() {\n    let account = await wallet.client.getActiveAccount();\n    if (!account) {\n        return {\n            success: false,\n            wallet: \"\",\n            pk: \"\"\n        };\n    }\n    return {\n        success: true,\n        wallet: account.address,\n        pk: account.publicKey\n    };\n}\n;\nconst disconnectWallet = async ()=>{\n    await wallet.disconnect();\n    wallet = new _taquito_beacon_wallet__WEBPACK_IMPORTED_MODULE_1__.BeaconWallet(options);\n    return {\n        success: true,\n        wallet: null\n    };\n};\nconst checkIfWalletConnected = async (wallet)=>{\n    try {\n        const activeAccount = await wallet.client.getActiveAccount();\n        if (!activeAccount) {\n            await wallet.client.requestPermissions({\n                type: {\n                    network: preferredNetwork\n                }\n            });\n        }\n        return {\n            success: true,\n            wallet: activeAccount\n        };\n    } catch (error) {\n        return {\n            success: false,\n            wallet: \"\",\n            error\n        };\n    }\n};\nconst sign = async (msg)=>{\n    const payload = {\n        signingType: _airgap_beacon_sdk__WEBPACK_IMPORTED_MODULE_2__.SigningType.MICHELINE,\n        payload: msg\n    };\n    const response = await checkIfWalletConnected(wallet);\n    if (response.success) {\n        const tezos = new _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__.TezosToolkit(rpcURL);\n        tezos.setWalletProvider(wallet);\n        return (await wallet.client.requestSignPayload(payload)).signature;\n    }\n};\nconst batch_contracts = async (contract_calls, amount)=>{\n    // const wallet = new BeaconWallet(options);\n    const response = await checkIfWalletConnected(wallet);\n    if (response.success) {\n        const tezos = new _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__.TezosToolkit(rpcURL);\n        tezos.setWalletProvider(wallet);\n        // const contract = await tezos.wallet.at(address);\n        // //console.log(\"s \", args)\n        // const operation = contract.methodsObject[func](args);\n        const batch = await tezos.wallet.batch(await Promise.all(contract_calls.map(async (contract_call)=>{\n            let contract = await tezos.wallet.at(contract_call.address);\n            return {\n                kind: _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__.OpKind.TRANSACTION,\n                ...contract.methodsObject[contract_call.func](contract_call.args).toTransferParams()\n            };\n        })));\n        const sending = await batch.send({\n            amount: amount\n        });\n        const result = await sending.confirmation();\n    // console.log(result);\n    }\n};\nconst contract = async (address, func, args, amount)=>{\n    // const wallet = new BeaconWallet(options);\n    const response = await checkIfWalletConnected(wallet);\n    if (response.success) {\n        const tezos = new _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__.TezosToolkit(rpcURL);\n        tezos.setWalletProvider(wallet);\n        const contract = await tezos.wallet.at(address);\n        //console.log(\"s \", args)\n        const operation = contract.methodsObject[func](args);\n        const sending = await operation.send({\n            amount: amount\n        });\n        const result = await sending.confirmation();\n    //console.log(result);\n    }\n};\nconst views = async (address, func, args)=>{\n    const tezos = new _taquito_taquito__WEBPACK_IMPORTED_MODULE_0__.TezosToolkit(rpcURL);\n    const contract = await tezos.contract.at(address);\n    return await contract.views[func](args).read();\n};\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFNRSxLQUFLLEdBQUcsT0FBTXhDLE9BQU8sRUFBRWdDLElBQUksRUFBRUMsSUFBSSxHQUFLO0lBQ2pELE1BQU1sQixLQUFLLEdBQUcsSUFBSWhDLDBEQUFZLENBQUNPLE1BQU0sQ0FBQztJQUN0QyxNQUFNcUMsUUFBUSxHQUFHLE1BQU1aLEtBQUssQ0FBQ1ksUUFBUSxDQUFDQyxFQUFFLENBQUM1QixPQUFPLENBQUM7SUFDakQsT0FBTyxNQUFNMkIsUUFBUSxDQUFDYSxLQUFLLENBQUNSLElBQUksQ0FBQyxDQUFDQyxJQUFJLENBQUMsQ0FBQ1EsSUFBSSxFQUFFLENBQUM7Q0FDaEQ7QUFNQyIsInNvdXJjZXMiOlsid2VicGFjazovL25jZmxhc2gvLi9saWIvd2FsbGV0LmpzPzQ2ZWMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT3BLaW5kLCBUZXpvc1Rvb2xraXQgfSBmcm9tIFwiQHRhcXVpdG8vdGFxdWl0b1wiO1xuaW1wb3J0IHsgQmVhY29uV2FsbGV0IH0gZnJvbSBcIkB0YXF1aXRvL2JlYWNvbi13YWxsZXRcIjtcbmltcG9ydCB7IFNpZ25pbmdUeXBlIH0gZnJvbSBcIkBhaXJnYXAvYmVhY29uLXNka1wiO1xuLy9pbXBvcnQgY29uZmlnIGZyb20gXCIuLi9jb25maWdcIjtcbi8vIFRPRE86IENoYW5nZSBiYWNrIHRvIGdob3N0bmV0IG9yIHRvIG90aGVyIHRlc3RuZXQgYWRkcmVzcyEhISEhIVxuY29uc3QgcHJlZmVycmVkTmV0d29yayA9IFwiZ2hvc3RuZXRcIjtcbi8vIGNvbnN0IHByZWZlcnJlZE5ldHdvcmsgPSBcIm1haW5uZXRcIjtcbmNvbnN0IG9wdGlvbnMgPSB7XG4gIG5hbWU6IFwiUmVja2xlc3NcIixcbiAgaWNvblVybDogXCJodHRwczovL3Rlem9zdGFxdWl0by5pby9pbWcvZmF2aWNvbi5wbmdcIixcbiAgcHJlZmVycmVkTmV0d29yazogcHJlZmVycmVkTmV0d29yayxcbn07XG5jb25zdCBycGNVUkwgPSBcImh0dHBzOi8vZ2hvc3RuZXQuc21hcnRweS5pb1wiO1xuLy8gY29uc3QgcnBjVVJMID0gXCJodHRwczovL21haW5uZXQuc21hcnRweS5pb1wiO1xuY29uc3Qgd2FsbGV0ID0gbmV3IEJlYWNvbldhbGxldChvcHRpb25zKTtcbi8vT3BLaW5kXG5jb25zdCBnZXRBY3RpdmVBY2NvdW50ID0gYXN5bmMgKCkgPT4ge1xuICByZXR1cm4ge3dhbGxldDogYXdhaXQgd2FsbGV0LmNsaWVudC5nZXRBY3RpdmVBY2NvdW50KCl9O1xufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbm5lY3RXYWxsZXQoKXtcbiAgbGV0IGFjY291bnQgPSBhd2FpdCB3YWxsZXQuY2xpZW50LmdldEFjdGl2ZUFjY291bnQoKTtcblxuICBpZiAoIWFjY291bnQpIHtcbiAgICBhd2FpdCB3YWxsZXQucmVxdWVzdFBlcm1pc3Npb25zKHtcbiAgICAgIG5ldHdvcms6IHsgdHlwZTogcHJlZmVycmVkTmV0d29yayB9LFxuICAgIH0pO1xuICAgIGFjY291bnQgPSBhd2FpdCB3YWxsZXQuY2xpZW50LmdldEFjdGl2ZUFjY291bnQoKTtcbiAgfVxuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB3YWxsZXQ6IGFjY291bnQuYWRkcmVzcywgcGsgOiBhY2NvdW50LnB1YmxpY0tleX07XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29ubmVjdFdhbGxldE5vUG9wVXAoKXtcbiAgbGV0IGFjY291bnQgPSBhd2FpdCB3YWxsZXQuY2xpZW50LmdldEFjdGl2ZUFjY291bnQoKTtcblxuICBpZiAoIWFjY291bnQpIHtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgd2FsbGV0OiBcIlwiLCBwazogXCJcIn07XG4gIH1cbiAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgd2FsbGV0OiBhY2NvdW50LmFkZHJlc3MsIHBrIDogYWNjb3VudC5wdWJsaWNLZXl9O1xufTtcblxuY29uc3QgZGlzY29ubmVjdFdhbGxldCA9IGFzeW5jICgpID0+IHtcbiAgYXdhaXQgd2FsbGV0LmRpc2Nvbm5lY3QoKTtcbiAgd2FsbGV0ID0gbmV3IEJlYWNvbldhbGxldChvcHRpb25zKTtcbiAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgd2FsbGV0OiBudWxsIH07XG59O1xuXG5jb25zdCBjaGVja0lmV2FsbGV0Q29ubmVjdGVkID0gYXN5bmMgKHdhbGxldCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGFjdGl2ZUFjY291bnQgPSBhd2FpdCB3YWxsZXQuY2xpZW50LmdldEFjdGl2ZUFjY291bnQoKTtcbiAgICBpZiAoIWFjdGl2ZUFjY291bnQpIHtcbiAgICAgIGF3YWl0IHdhbGxldC5jbGllbnQucmVxdWVzdFBlcm1pc3Npb25zKHtcbiAgICAgICAgdHlwZTogeyBuZXR3b3JrOiBwcmVmZXJyZWROZXR3b3JrIH0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICB3YWxsZXQ6IGFjdGl2ZUFjY291bnRcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHdhbGxldDogXCJcIixcbiAgICAgIGVycm9yLFxuICAgIH07XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBzaWduID0gYXN5bmMgKG1zZykgPT4ge1xuICBjb25zdCBwYXlsb2FkID0ge1xuICAgIHNpZ25pbmdUeXBlOiBTaWduaW5nVHlwZS5NSUNIRUxJTkUsXG4gICAgcGF5bG9hZDptc2csIFxuICAgIC8vIHNvdXJjZUFkZHJlc3M6cGtoXG4gIH1cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaGVja0lmV2FsbGV0Q29ubmVjdGVkKHdhbGxldCk7XG5cbiAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICBjb25zdCB0ZXpvcyA9IG5ldyBUZXpvc1Rvb2xraXQocnBjVVJMKTtcbiAgICB0ZXpvcy5zZXRXYWxsZXRQcm92aWRlcih3YWxsZXQpO1xuICAgIHJldHVybiAoYXdhaXQgd2FsbGV0LmNsaWVudC5yZXF1ZXN0U2lnblBheWxvYWQocGF5bG9hZCkpLnNpZ25hdHVyZVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBiYXRjaF9jb250cmFjdHMgPSBhc3luYyAoY29udHJhY3RfY2FsbHMsIGFtb3VudCkgPT4ge1xuICAvLyBjb25zdCB3YWxsZXQgPSBuZXcgQmVhY29uV2FsbGV0KG9wdGlvbnMpO1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNoZWNrSWZXYWxsZXRDb25uZWN0ZWQod2FsbGV0KTtcblxuICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgIGNvbnN0IHRlem9zID0gbmV3IFRlem9zVG9vbGtpdChycGNVUkwpO1xuICAgIHRlem9zLnNldFdhbGxldFByb3ZpZGVyKHdhbGxldCk7XG4gICAgXG4gICAgLy8gY29uc3QgY29udHJhY3QgPSBhd2FpdCB0ZXpvcy53YWxsZXQuYXQoYWRkcmVzcyk7XG4gICAgLy8gLy9jb25zb2xlLmxvZyhcInMgXCIsIGFyZ3MpXG4gICAgLy8gY29uc3Qgb3BlcmF0aW9uID0gY29udHJhY3QubWV0aG9kc09iamVjdFtmdW5jXShhcmdzKTtcbiAgICBcbiAgICBjb25zdCBiYXRjaCA9IGF3YWl0IHRlem9zLndhbGxldC5iYXRjaChcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbnRyYWN0X2NhbGxzLm1hcChhc3luYyBjb250cmFjdF9jYWxsID0+IHtcbiAgICAgICAgbGV0IGNvbnRyYWN0ID0gYXdhaXQgdGV6b3Mud2FsbGV0LmF0KGNvbnRyYWN0X2NhbGwuYWRkcmVzcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2luZDogT3BLaW5kLlRSQU5TQUNUSU9OLCBcbiAgICAgICAgICAuLi5jb250cmFjdC5tZXRob2RzT2JqZWN0W2NvbnRyYWN0X2NhbGwuZnVuY10oY29udHJhY3RfY2FsbC5hcmdzKS50b1RyYW5zZmVyUGFyYW1zKCkgIFxuICAgICAgICB9XG4gICAgICB9KSlcbiAgICApO1xuXG4gICAgY29uc3Qgc2VuZGluZyA9IGF3YWl0IGJhdGNoLnNlbmQoeyBhbW91bnQ6IGFtb3VudCB9KTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZW5kaW5nLmNvbmZpcm1hdGlvbigpO1xuICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBjb250cmFjdCA9IGFzeW5jIChhZGRyZXNzLCBmdW5jLCBhcmdzLCBhbW91bnQpID0+IHtcbiAgLy8gY29uc3Qgd2FsbGV0ID0gbmV3IEJlYWNvbldhbGxldChvcHRpb25zKTtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaGVja0lmV2FsbGV0Q29ubmVjdGVkKHdhbGxldCk7XG5cbiAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICBjb25zdCB0ZXpvcyA9IG5ldyBUZXpvc1Rvb2xraXQocnBjVVJMKTtcbiAgICB0ZXpvcy5zZXRXYWxsZXRQcm92aWRlcih3YWxsZXQpO1xuICAgIGNvbnN0IGNvbnRyYWN0ID0gYXdhaXQgdGV6b3Mud2FsbGV0LmF0KGFkZHJlc3MpO1xuICAgIC8vY29uc29sZS5sb2coXCJzIFwiLCBhcmdzKVxuICAgIGNvbnN0IG9wZXJhdGlvbiA9IGNvbnRyYWN0Lm1ldGhvZHNPYmplY3RbZnVuY10oYXJncyk7XG4gICAgY29uc3Qgc2VuZGluZyA9IGF3YWl0IG9wZXJhdGlvbi5zZW5kKHsgYW1vdW50OiBhbW91bnQgfSk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZGluZy5jb25maXJtYXRpb24oKTtcbiAgICAvL2NvbnNvbGUubG9nKHJlc3VsdCk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCB2aWV3cyA9IGFzeW5jKGFkZHJlc3MsIGZ1bmMsIGFyZ3MpID0+IHtcbiAgY29uc3QgdGV6b3MgPSBuZXcgVGV6b3NUb29sa2l0KHJwY1VSTCk7XG4gIGNvbnN0IGNvbnRyYWN0ID0gYXdhaXQgdGV6b3MuY29udHJhY3QuYXQoYWRkcmVzcyk7IFxuICByZXR1cm4gYXdhaXQgY29udHJhY3Qudmlld3NbZnVuY10oYXJncykucmVhZCgpO1xufVxuXG5leHBvcnQge1xuICBkaXNjb25uZWN0V2FsbGV0LFxuICBnZXRBY3RpdmVBY2NvdW50LFxuICBjaGVja0lmV2FsbGV0Q29ubmVjdGVkLFxufTtcbiJdLCJuYW1lcyI6WyJPcEtpbmQiLCJUZXpvc1Rvb2xraXQiLCJCZWFjb25XYWxsZXQiLCJTaWduaW5nVHlwZSIsInByZWZlcnJlZE5ldHdvcmsiLCJvcHRpb25zIiwibmFtZSIsImljb25VcmwiLCJycGNVUkwiLCJ3YWxsZXQiLCJnZXRBY3RpdmVBY2NvdW50IiwiY2xpZW50IiwiY29ubmVjdFdhbGxldCIsImFjY291bnQiLCJyZXF1ZXN0UGVybWlzc2lvbnMiLCJuZXR3b3JrIiwidHlwZSIsInN1Y2Nlc3MiLCJhZGRyZXNzIiwicGsiLCJwdWJsaWNLZXkiLCJjb25uZWN0V2FsbGV0Tm9Qb3BVcCIsImRpc2Nvbm5lY3RXYWxsZXQiLCJkaXNjb25uZWN0IiwiY2hlY2tJZldhbGxldENvbm5lY3RlZCIsImFjdGl2ZUFjY291bnQiLCJlcnJvciIsInNpZ24iLCJtc2ciLCJwYXlsb2FkIiwic2lnbmluZ1R5cGUiLCJNSUNIRUxJTkUiLCJyZXNwb25zZSIsInRlem9zIiwic2V0V2FsbGV0UHJvdmlkZXIiLCJyZXF1ZXN0U2lnblBheWxvYWQiLCJzaWduYXR1cmUiLCJiYXRjaF9jb250cmFjdHMiLCJjb250cmFjdF9jYWxscyIsImFtb3VudCIsImJhdGNoIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImNvbnRyYWN0X2NhbGwiLCJjb250cmFjdCIsImF0Iiwia2luZCIsIlRSQU5TQUNUSU9OIiwibWV0aG9kc09iamVjdCIsImZ1bmMiLCJhcmdzIiwidG9UcmFuc2ZlclBhcmFtcyIsInNlbmRpbmciLCJzZW5kIiwicmVzdWx0IiwiY29uZmlybWF0aW9uIiwib3BlcmF0aW9uIiwidmlld3MiLCJyZWFkIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./lib/wallet.js\n");

/***/ })

};
;