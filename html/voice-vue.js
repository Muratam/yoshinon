exports.planeVoice = {
  props: ['text'],
  template: `<div>{{text}}</div>`,
};
exports.mediaVoice = {
  props: ['image', 'head', 'text'],
  template: `
      <div class="media">
        <a class="media-left">
          <img style="height:3em;opacity:0.7" alt="" :src="image">
        </a>
        <div class="media-body">
          <strong>{{head}}</strong>
          <div class="voice">{{text}}</div>
        </div>
      </div>`
};
