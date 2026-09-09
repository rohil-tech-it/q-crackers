/* ============================================================
   DELIVERY LOCATION PICKER (Mettur Transports branch directory)
   Requires locations-data.js to be loaded BEFORE this file:
   <script src="locations-data.js"></script>
   <script src="location-picker.js"></script>
   ============================================================ */

window.selectedDeliveryLocation = null; // { state, region, branch, city, phone }

function qcPopulateSelect(selectEl, items, placeholder) {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach((label, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = label;
        selectEl.appendChild(opt);
    });
}

function qcInitLocationModal() {
    const stateSelect = document.getElementById('stateSelect');
    const districtSelect = document.getElementById('districtSelect');
    const branchSelect = document.getElementById('branchSelect');
    if (!stateSelect || !districtSelect || !branchSelect) return;

    const states = Object.keys(window.QC_LOCATIONS || {});
    qcPopulateSelect(stateSelect, states, 'Select State');
    districtSelect.innerHTML = `<option value="">Select District</option>`;
    branchSelect.innerHTML = `<option value="">Select Branch</option>`;

    stateSelect.onchange = function () {
        const state = this.value;
        branchSelect.innerHTML = `<option value="">Select Branch</option>`;
        if (!state || !window.QC_LOCATIONS[state]) {
            districtSelect.innerHTML = `<option value="">Select District</option>`;
            return;
        }
        const regions = Object.keys(window.QC_LOCATIONS[state]);
        qcPopulateSelect(districtSelect, regions, 'Select District');
    };

    districtSelect.onchange = function () {
        const state = stateSelect.value;
        const region = this.value;
        if (!state || !region) {
            branchSelect.innerHTML = `<option value="">Select Branch</option>`;
            return;
        }
        const branches = (window.QC_LOCATIONS[state] && window.QC_LOCATIONS[state][region]) || [];
        const labels = branches.map(b => b.city && b.city !== b.branch ? `${b.branch} (${b.city})` : b.branch);
        qcPopulateSelect(branchSelect, labels, 'Select Branch');
    };
}

function openLocationModal() {
    qcInitLocationModal();
    // Restore previous selection if any, so re-opening keeps the choice
    if (window.selectedDeliveryLocation) {
        const { state, region } = window.selectedDeliveryLocation;
        const stateSelect = document.getElementById('stateSelect');
        const districtSelect = document.getElementById('districtSelect');
        if (stateSelect) {
            stateSelect.value = state;
            stateSelect.onchange();
            districtSelect.value = region;
            districtSelect.onchange();
        }
    }
    document.getElementById('locationModal').style.display = 'block';
}

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
}

function confirmLocation() {
    const stateSelect = document.getElementById('stateSelect');
    const districtSelect = document.getElementById('districtSelect');
    const branchSelect = document.getElementById('branchSelect');

    const state = stateSelect.value;
    const region = districtSelect.value;
    const branchIdx = branchSelect.value;

    if (!state || !region || branchIdx === '') {
        alert('Please select State, District and Branch to continue.');
        return;
    }

    const branchObj = window.QC_LOCATIONS[state][region][parseInt(branchIdx, 10)];

    window.selectedDeliveryLocation = {
        state: state,
        region: region,
        branch: branchObj.branch,
        city: branchObj.city,
        phone: branchObj.phone || ''
    };

    const textEl = document.getElementById('selectedLocationText');
    if (textEl) {
        textEl.textContent = `Selected: ${branchObj.branch}, ${region}, ${state}`;
    }

    closeLocationModal();
}

window.openLocationModal = openLocationModal;
window.closeLocationModal = closeLocationModal;
window.confirmLocation = confirmLocation;

document.addEventListener('DOMContentLoaded', qcInitLocationModal);