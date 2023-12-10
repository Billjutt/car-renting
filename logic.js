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


/* global getFactory getAssetRegistry getParticipantRegistry emit */

/**
 * Create the License asset
 * @param {org.example.carrental.UploadLicense} uploadLicense - the UploadLicense transaction
 * @transaction
 */
async function uploadLicense(tx) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';
     //create new car renting application
    const license = factory.newResource(namespace, 'License', tx.license.licenseId);
    license.customer = factory.newRelationship(namespace, 'Customer', tx.customer.getIdentifier());
    console.log(customer);
    license.licenseStatus = 'PENDING';

    // Save the license
    const assetRegistry = await getAssetRegistry(namespace + '.License');
    await assetRegistry.add(license);

   
}
/**
 * Check and Process License Approval or Rejection
 * @param {org.example.carrental.CheckLicense} checkLicense - the CheckLicense transaction
 * @transaction
 */
async function checkLicense(tx) {

    const factory = getFactory();
    const namespace = 'org.example.carrental';

    console.log(tx)
    const license = tx.license
    const licenseStatus = license.licenseStatus;

    if (licenseStatus !== 'PENDING') {
        throw new Error('This license is in the wrong state to be processed');
    } else {
       
        license.licenseStatus = 'APPROVED';
        
    }

    // Update the license status
    
    const assetRegistry = await getAssetRegistry(namespace + '.License');
    await assetRegistry.update(license);

   
}
/**
 * Select a Car
 * @param {org.example.carrental.SelectCar} selectCar - the SelectCar transaction
 * @transaction
 */
async function selectCar(tx) {
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const customer = getCurrentParticipant()
    const carId = tx.car.carId;

    
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    const car = await carRegistry.get(carId);

    /*if (car.available === false) {
        throw new Error('The selected car is not available');
    }*/
    const license = tx.license;
    const licenseStatus = license.licenseStatus;
    
      console.log(licenseStatus);
    if (licenseStatus === 'APPROVED') {
        car.available = false;
        car.carStatus = 'SELECTED';

        
        
    } else  {
        throw new Error ('the customer can not select car');
    } 
    


    // Update the car status
    await carRegistry.update(car);

}   
/**
 * Deliver a Car
 * @param {org.example.carrental.DeliverCar} deliverCar - the DeliverCar transaction
 * @transaction
 */
async function deliverCar(tx) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = tx.car;
    const customer = tx.customer;

    if (car.carStatus !== 'SELECTED') {
        throw new Error('The car must be selected before it can be delivered');
    }

    car.carStatus = 'DELIVERED';

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);

    
}

/**
 * Check a Car
 * @param {org.example.carrental.CheckCar} checkCar - the CheckCar transaction
 * @transaction
 */
async function checkCar(tx) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = tx.car;

    if (car.carStatus !== 'DELIVERED') {
        throw new Error('The car must be delivered before it can be checked');
    }

    if (car.carStatus === 'DAMAGED') {
        // If the car is damaged, require extra payment from the customer
        // You can customize the logic for calculating and processing the extra payment
       
        // Assuming there's a method to handle payment, adjust accordingly
        throw new Error('The customer must be do extra payment for damaged');
    }

    car.carStatus = 'CHECKED';

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);


}
/**
 * Return a Car
 * @param {org.example.carrental.ReturnCar} returnCar - the ReturnCar transaction
 * @transaction
 */
async function returnCar(tx) { // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const namespace = 'org.example.carrental';

    const car = tx.car;

    if (car.carStatus !== 'CHECKED') {
        throw new Error('The car must be checked before it can be returned');
    }

    car.carStatus = 'RETURNED';
    car.available = true;

    // Update the car status
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.update(car);

}
/**
 * Transaction to add a new car to the Car registry
 * @param {org.example.carrental.AddCar} addCar - the AddCar transaction
 * @transaction
 */
async function addCar(tx) {
    const factory = getFactory();
    const namespace = 'org.example.carrental';
  
    // Create a new Car instance
    const newCar = factory.newResource(namespace, 'Car', tx.car.carId);
    newCar.brand = tx.brand;
    newCar.model = tx.model;
    newCar.color = tx.color;
    newCar.year = tx.year;
    newCar.rentalRate = tx.rentalRate;
    newCar.available = true; // Assuming a new car is initially available
    newCar.carStatus = 'AVAILABLE';
  
    // Add the new car to the registry
    const carRegistry = await getAssetRegistry(namespace + '.Car');
    await carRegistry.add(newCar);
  }

/**
 * Function to remove cars with a high rental rate
 * @param {org.example.carrental.RemoveCarsByHighRentalRate} removeCarsByHighRentalRate - the RemoveCarsByHighRentalRate query
 * @transaction
 */
async function removeCarsByHighRentalRate(tx) {
    const namespace = 'org.example.carrental';

    // Get the car registry
    const carRegistry = await getAssetRegistry(namespace + '.Car');

    // Execute the query to select cars with high rental rate
    const results = await query('RemoveCarsByHighRentalRate');

    for (let i = 0; i < results.length; i++) {
        let car = results[i];

    

        // Remove the car from the registry
        await carRegistry.remove(car);
    }
}
/**
 * Function to remove cars by color
 * @param {org.example.carrental.SelectCarsByColor} tx - the SelectCarsByColor query
 * @transaction
 */
async function selectCarsByColor(tx) {
    const namespace = 'org.example.carrental';

    // Get the car registry
    const carRegistry = await getAssetRegistry(namespace + '.Car');

    // Execute the query to select cars by color
    const results = await query('selectCarsByColor', {
        color: tx.car.color
    });
    console.log(results);
    for (let i = 0; i < results.length; i++) {
        let car = results[i];

        // select the car from the registry
        await carRegistry.select(car);
    }
}


  

  
