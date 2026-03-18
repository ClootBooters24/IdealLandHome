/* jshint esversion: 11 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('contact-submit');
    const successMsg = document.getElementById('form-success');
    const errorMsg = document.getElementById('form-error');

    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        // Basic HTML5 validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        errorMsg.hidden = true;

        const formData = new FormData(form);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                form.hidden = true;
                successMsg.hidden = false;
                successMsg.focus();
            } else {
                throw new Error(data.message || 'Submission failed.');
            }
        } catch (err) {
            errorMsg.textContent =
                'There was a problem sending your message. Please try again or call us directly.';
            errorMsg.hidden = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
});
