const Vue = require('vue/dist/vue.min');
const $ = require('jquery');
const {ipcRenderer} = require('electron');

const planeVoice = {
  props: ['text'],
  template: `<div class="voice-innercontent">{{text}}</div>`,
};

const mediaVoice = {
  props: ['image', 'head', 'text'],
  template: `
      <div class="voice-innercontent">
        <a class="media-left">
          <img style="height:3em;" alt="" :src="image">
        </a>
        <div class="media-body">
          <strong>{{head}}</strong>
          <div>{{text}}</div>
        </div>
      </div>`
};


const app = new Vue({
  el: '#app',
  template: `
      <div class="voice-wrapper fukidashi">
        <div v-for="voice in voices">
          <plane v-if="! voice.image" :text="voice.text"></plane>
          <media v-if="voice.image" :image="voice.image" :head="voice.head" :text="voice.text"></media>
        </div>
      </div>`,
  data: {
    voices: [],
    allData: {},
    showAll: false,
    currentChannel: '',
    transparented: false,
    autoTransparentMilSec: 5000,
  },
  components: {plane: planeVoice, media: mediaVoice},
  methods: {
    parseContent(msg, media) {
      if (!media) {
        return ['plane', {text: msg}];
      } else {
        const {icon_url, channel, name, text} =
            typeof(msg) === 'string' ? JSON.parse(msg) : msg;
        return [
          channel, {image: icon_url, head: channel + ' ' + name, text: text}
        ];
      }
    },
    changeChannel(channel) {
      // TODO: deprecated!!
      this.allData[channel] = this.allData[channel] || [];
      this.currentChannel = channel;
      if (this.showAll) {
        this.voices = this.allData[channel];
      } else {
        this.voices = [this.allData[channel][0]];
      }
    },
    changeVoice(msg, media) {
      const [channel, content] = this.parseContent(msg, media);
      const updateContents = () => {
        this.allData[channel] = this.allData[channel] || [];
        this.allData[channel].unshift(content);
        this.currentChannel = channel;
        if (this.showAll) {
          this.voices = this.allData[channel];
        } else {
          this.voices = [content];
        }
      };
      $('html')
          .animate({opacity: 0}, 720, updateContents)
          .animate({opacity: 1}, 720);
    },
    changeShowAll(showAll) {
      this.showAll = showAll;
      if (this.showAll) {
        // show all
        if ($('.transparent')[0]) {
          this.voices = [];
        } else {
          this.voices = this.allData[this.currentChannel];
        }
        $(this.$el).removeClass('fukidashi');
      } else {
        // don't show all
        this.voices = [this.allData[this.currentChannel][0]];
        $(this.$el).addClass('fukidashi');
        if (this.autoTransparentMilSec > 1) {
          $('html').animate({opacity: 0}, this.autoTransparentMilSec);
        }
      }
    },
    updateChannelHistory(channel, hists) {
      hists = hists.map(h => this.parseContent(h, true)[1]);
      this.allData[channel] = hists;
      this.changeChannel(channel);
    },
    setTransparented(transparented) {
      this.transparented = transparented;
      if (this.transparented) {
        $('*').addClass('transparent')
      } else {
        $('*').removeClass('transparent')
      }
    },
    toggleTransparented() {
      this.setTransparented(!this.transparented);
    }
  }
});

ipcRenderer.on('voice', (evt, msg) => {app.changeVoice(msg, false)});
ipcRenderer.on('media-voice', (evt, msg) => {app.changeVoice(msg, true)});
ipcRenderer.on('focus', (evt, msg) => {app.changeShowAll(true)});
ipcRenderer.on('blur', (evt, msg) => {app.changeShowAll(false)});
ipcRenderer.on('toggle', (evt, msg) => {app.toggleTransparented()});
ipcRenderer.on('update-channel-history', (evt, msg) => {
  const [channel, hists] = JSON.parse(msg);
  app.updateChannelHistory(channel, hists);
});
app.changeVoice(
    'ずいぶんと遅い目覚めでしてー、今日のよき日は始まっていますよー', false);