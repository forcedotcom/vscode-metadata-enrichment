import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ServiceRequestForm extends LightningElement {
  @track subject = '';
  @track priority = 'Medium';

  get priorityOptions() {
    return [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' }
    ];
  }

  handleSubjectChange(event) {
    this.subject = event.target.value;
  }

  handlePriorityChange(event) {
    this.priority = event.detail.value;
  }

  handleSubmit() {
    if (!this.subject) {
      this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: 'Subject is required.', variant: 'error' }));
      return;
    }
    this.dispatchEvent(
      new ShowToastEvent({ title: 'Success', message: 'Service request submitted.', variant: 'success' })
    );
  }
}
