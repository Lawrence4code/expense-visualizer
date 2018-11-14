import database from './firebase';

const form = document.querySelector('form');
const name = document.querySelector('#name');
const cost = document.querySelector('#cost');
const error = document.querySelector('#error');

form.addEventListener('submit', e => {
  e.preventDefault();

  const item = {
    name: name.value,
    cost: parseInt(cost.value)
  };

  if (name.value && cost.value) {
    database
      .collection('expenses')
      .add(item)
      .then(res => {
        name.value = '';
        cost.value = '';
        error.textContent = '';
      });
  } else if (name.value && !cost.value) {
    error.textContent = 'Cost of item is required.';
  } else if (cost.value && !name.value) {
    error.textContent = 'Name of item is required.  ';
  } else {
    error.textContent = 'Name and Cost of item is required.';
  }
});
