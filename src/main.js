import './scss/style.scss';

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