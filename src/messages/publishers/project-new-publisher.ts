import {EventTypes, ProjectNewRequestEvent, Publisher} from 'flaky-common';

export class ProjectNewPublisher extends Publisher<ProjectNewRequestEvent> {
  eventType: EventTypes.ProjectNewRequest = EventTypes.ProjectNewRequest;
  routingKey = this.eventType + '.java';
}
