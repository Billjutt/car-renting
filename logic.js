/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* global getFactory getAssetRegistry getParticipantRegistry emit */

/**
 * Create the License asset
 * @param {org.example.carrental.UploadLicense} uploadLicense - the UploadLicense transaction
 * @transaction
 */
async function uploadLicense(uploadLicense) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const license = factory.newResource(namespace, 'License', uploadLicense.licenseId);
    license.customer = factory.newRelationship(namespace, 'Customer', uploadLicense.customer.getIdentifier());
    license.status = 'PENDING';

    // Save the license
    const assetRegistry = await getAssetRegistry(license.getFullyQualifiedType());
    await assetRegistry.add(license);

    // Emit event
    const uploadLicenseEvent = factory.newEvent(namespace, 'UploadLicenseEvent');
    uploadLicenseEvent.license = license;
    emit(uploadLicenseEvent);
}

/**
 * Approve the License
 * @param {org.example.carrental.ApproveLicense} approveLicense - the ApproveLicense transaction
 * @transaction
 */
async function approveLicense(approveLicense) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const license = approveLicense.license;

    if (license.status === 'REJECTED') {
        throw new Error('This license has already been rejected');
    } else if (license.status === 'APPROVED') {
        throw new Error('This license has already been approved');
    }

    license.status = 'APPROVED';

    // Update the license status
    const assetRegistry = await getAssetRegistry(license.getFullyQualifiedType());
    await assetRegistry.update(license);

    // Emit event
    const approveLicenseEvent = factory.newEvent(namespace, 'ApproveLicenseEvent');
    approveLicenseEvent.license = license;
    emit(approveLicenseEvent);
}


/**
 * Reject the License
 * @param {org.example.carrental.RejectLicense} rejectLicense - the RejectLicense transaction
 * @transaction
 */
async function rejectLicense(rejectLicense) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const license = rejectLicense.license;

    if (license.status === 'REJECTED') {
        throw new Error('This license has already been rejected');
    } else if (license.status === 'APPROVED') {
        throw new Error('This license has already been approved');
    } else if (license.status === 'EXPIRED' || license.status === 'REVOKED') {
        throw new Error('This license is expired or revoked, and cannot be approved');
    }
    

    license.status = 'REJECTED';

    // Update the license status
    const assetRegistry = await getAssetRegistry(license.getFullyQualifiedType());
    await assetRegistry.update(license);

    // Emit event
    const rejectLicenseEvent = factory.newEvent(namespace, 'RejectLicenseEvent');
    rejectLicenseEvent.license = license;
    rejectLicenseEvent.closeReason = rejectLicense.closeReason;
    emit(rejectLicenseEvent);
}



/**
 * Select a Car
 * @param {org.example.carrental.SelectCar} selectCar - the SelectCar transaction
 * @transaction
 */
async function selectCar(selectCar) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const customer = selectCar.customer;
    const carId = selectCar.carId;

    const carRegistry = await getAssetRegistry(namespace + '.Car');
    const car = await carRegistry.get(carId);

    if (!car || car.available === false) {
        throw new Error('The selected car is not available');
    }

    const licenseRegistry = await getAssetRegistry(namespace + '.License');
    const customerLicense = await licenseRegistry.get(customer.getIdentifier());

    if (!customerLicense || customerLicense.status !== 'APPROVED') {
        throw new Error('You cannot select a car without an approved license');
    }

    car.available = false;
    car.status = 'SELECTED';

    // Update the car status
    await carRegistry.update(car);

    // Emit event
    const selectCarEvent = factory.newEvent(namespace, 'SelectCarEvent');
    selectCarEvent.customer = customer;
    selectCarEvent.car = car;
    emit(selectCarEvent);
}


/**
 * Deliver a Car
 * @param {org.example.carrental.DeliverCar} deliverCar - the DeliverCar transaction
 * @transaction
 */
async function deliverCar(deliverCar) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = deliverCar.car;
    const customer = deliverCar.customer;

    if (car.status !== 'SELECTED') {
        throw new Error('The car must be selected before it can be delivered');
    }

    car.status = 'DELIVERED';

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);

    // Emit event
    const deliverCarEvent = factory.newEvent(namespace, 'DeliverCarEvent');
    deliverCarEvent.customer = customer;
    deliverCarEvent.car = car;
    emit(deliverCarEvent);
}

/**
 * Check a Car
 * @param {org.example.carrental.CheckCar} checkCar - the CheckCar transaction
 * @transaction
 */
async function checkCar(checkCar) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = checkCar.car;

    if (car.status !== 'DELIVERED') {
        throw new Error('The car must be delivered before it can be checked');
    }

    if (car.status === 'DAMAGED') {
        // If the car is damaged, require extra payment from the customer
        // You can customize the logic for calculating and processing the extra payment
       
        // Assuming there's a method to handle payment, adjust accordingly
        throw new Error('The customer must be do extra payment for damaged');
    }

    car.status = 'CHECKED';

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);

    // Emit event
    const checkCarEvent = factory.newEvent(namespace, 'CheckCarEvent');
    checkCarEvent.car = car;

    // You can add more event details if needed

    // Emit the event
    emit(checkCarEvent);
}

/**
 * Return a Car
 * @param {org.example.carrental.ReturnCar} returnCar - the ReturnCar transaction
 * @transaction
 */
async function returnCar(returnCar) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = returnCar.car;

    if (car.status !== 'CHECKED') {
        throw new Error('The car must be checked before it can be returned');
    }

    car.status = 'RETURNED';
    car.available = true;

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);

    // Emit event
    const returnCarEvent = factory.newEvent(namespace, 'ReturnCarEvent');
    returnCarEvent.car = car;
    emit(returnCarEvent);
}

/**
 * Create the participants needed for the demo
 * @param {org.example.carrental.CreateDemoParticipants}
