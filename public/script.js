/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scss_style_scss__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scss_style_scss___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__scss_style_scss__);


window.onload = function () {
    formValidation();
    togglable();
    flashMessage();
}

function formValidation() {
    var petitionCreator = document.querySelector('#petition_creator');
    // existence check
    if (petitionCreator === null) return;

    var petitionPreviewer = document.querySelector('#petition_previewer');
    var petitionDraft = petitionPreviewer.querySelector('#petition_draft');

    var formControls = petitionCreator.querySelectorAll('.form-control');
    // preview button
    var preview = petitionCreator.querySelector('button#preview');
    // go-back button
    var goBack = petitionPreviewer.querySelector('button#go_back');

    formControls.forEach((formControl, i) => {
        formControl.addEventListener('input', () => {
            petitionDraft.childNodes[i].innerHTML = formControl.value;
        });
    });

    preview.addEventListener('click', () => {
        var isValid = true;
        formControls.forEach(formControl => {
            if (!formControl.validity.valid) {
                isValid = false;
                formControl.parentElement.classList.add('error');
            }
        });
        if (isValid === true) {
            petitionCreator.classList.add('hidden');
            petitionPreviewer.classList.remove('hidden');
        }
    });
    goBack.addEventListener('click', () => {
        petitionCreator.classList.remove('hidden');
        petitionPreviewer.classList.add('hidden');
    });
}

function togglable() {
    var togglers = document.querySelectorAll('[class$=toggler]');
    // existence check
    if (togglers === null) return;

    togglers.forEach(toggler => {
        var togglable = toggler.parentNode;
        toggler.addEventListener('click', () => {
            togglable.classList.toggle('open');
        });
    });
}

function flashMessage() {
    var flashMessages = document.querySelectorAll('.flash-msg');
    if (!flashMessages) return;
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.classList.add('fadding');
        }, 2000);
        setTimeout(() => {
            msg.classList.add('closed');
        }, 4000);
    });
}

/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);