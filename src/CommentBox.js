import React from 'react';
import ReactTooltip from 'react-tooltip'
import Opentip from "../opentip-native.js"
import "../opentip.css"

import $ from 'jquery';

var TextContainer = React.createClass({
  render: function() {
    return (
            <div>
            <Aud url="/api/audio/97" />
        <TextBox url="/api/text/97" posturl="/api/post" />
        </div>
    );
  }
});

var Aud = React.createClass({
  getInitialState: function() {
    return {data: "https://catplanet.cat/line/mbmbam97slice.mp3"};
  },
  render: function() {
    return (
         <div>
           <audio controls id="mbmbam">
             <source src={this.state.data} type="audio/mpeg" />
           </audio>
         </div>
     );
  }
});

/*global $*/
var TextBox = React.createClass({
  loadTextFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        let dict = {}
        data.forEach(function(word, idx) {
            let time = word.time;
            let arr = time.split(":");
            let ms = parseInt(arr[0])*3600 + parseInt(arr[1])*60 + parseFloat(arr[2]);
            dict[idx] = ms;
        });
        this.setState({data: data});
        this.setState({stamps: dict});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  sendSpeakerUpdatesToServer: function() {
    $.ajax({
      url: this.props.posturl,
      dataType: 'json',
      contentType: 'application/json',
      cache: false,
      method: "POST",
      data: JSON.stringify(this.state.data),
      success: function() {
          console.log("sent info to server");
      },
      error: function(xhr, status, err) {
        console.error(this.props.posturl, status, err.toString());
      }.bind(this) 
    });
  },
  setGriffin: function() {
    this.state.selected.forEach(function(id) {
      this.state.data[id].speaker = "Griffin";
    }.bind(this));
    console.log(this.state.data);
    this.sendSpeakerUpdatesToServer();
    this.setState({selected: []});
  },
  setTime: function(index) {
      if(index < 0) {index = 0;}
      if(index > this.state.data.length) {index = this.state.data.length;}
      this.state.audio.currentTime = this.state.stamps[index];
  },
  onKeyPress(key){
      if(!this.state.tooltip){
        key.preventDefault();
        console.log(key.code);
        if(key.code == "KeyH"){
          if(this.state.selecting) {
            if(this.state.selected) {
              this.setTime(this.state.selected.pop()-1);
            }
          } else {
            this.setTime(this.state.hilight-1);
          }
        }
        if(key.code == "KeyL"){
          if(this.state.selecting) {
            let id = this.state.selected.length ? this.state.selected[this.state.selected.length-1] + 1 : this.state.hilight;
            this.state.selected.push(id);
            this.setTime(id);
          } else {
            this.setTime(this.state.hilight+1);
          }
        }
        if(key.code == "Space"){
          if(this.state.audio.paused){
              this.state.audio.play();
          } else {
              this.state.audio.pause();
          }
        }
        if(key.code == "KeyG"){
          this.setGriffin();
        }
        if(key.code == "KeyE"){
          this.setState({tooltip: true});
          $("#text_box").focus();
        }
      } 
  },
  onKeyDown(key) {
    if(key.key == "Shift") {
        this.state.audio.pause();
        this.setState({selecting: true});
    } else {
      if(key.key == "Escape"){
        this.setState({tooltip: false})
      }
    }
  },
  onKeyUp(key) {
    if(key.key == "Shift") {
        this.setState({selecting: false});
    }
  },
  formSubmit(id, word) {
    let temp = this.state.data;
    temp[id].text = word;
    this.setState({data: temp});
    this.setState({tooltip: false});
    //sendSpeakerUpdatesToServer();
  },
  componentWillMount: function(){
      document.addEventListener("keypress", this.onKeyPress, false);
      document.addEventListener("keydown", this.onKeyDown, false);
      document.addEventListener("keyup", this.onKeyUp, false);
  },
  getHilight: function() {
      let time = this.state.audio.currentTime;
      let len = this.state.data.length;
      let word = 0;
      for(let i=this.state.start;i<len;i++) {
          if(this.state.stamps[i]-0.00001<=time){
              word = i;
          } else {break;}
      }
      if(word) {
          this.setState({start: word});
          this.setState({hilight : word});
      } else {
          this.setState({start: 0});
      }
      requestAnimationFrame(this.getHilight);
  },
  getInitialState: function() {
    let aud = document.getElementById("mbmbam");
    return {data: [], stamps: {}, episode: "97", hilight: 0, start: 0, selected: [], selecting: false, audio: aud, tooltip: false};
  },
  componentDidMount: function() {
    this.loadTextFromServer(); let aud = document.getElementById("mbmbam");
    this.setState({ audio: aud});
    this.setState({
        hilight: requestAnimationFrame(this.getHilight)
    });
    //setInterval(this.loadTextFromServer, this.props.pollInterval);
  },
  handleChangeEpisode: function(ep) {
    this.setState({episode: ep});
  },
  render: function() {
    let style = {display: "inline"}
    return (
      <span style={style} className="">
        <h1>Text</h1>
        <WordList data={this.state.data} formCB={this.formSubmit} tooltip={this.state.tooltip} selected={this.state.selected} hilight={this.state.hilight}/>
      </span>
    );
  }
});

var Word = React.createClass({
  callback: function(e) {
      e.preventDefault();
      this.props.formCB(this.props.id, this.state.value);
  },
  getInitialState: function() {
    return {value: "", tt: false, tooltip: false};
  },
  handleChange: function(e) {
        this.setState({value: e.target.value});
  },
  componentWillReceiveProps(newprops) {
    if (newprops.tooltip && !this.state.tooltip && this.props.id === this.props.hilight.toString()) {
      console.log('made a tooltip');
      let target = "#"+{this.props.id}
      let new_tooltip = new Opentip(this.refs.foo, 'banana', 'abababannbanb', {target: {target}, tipJoint: "top"});
      new_tooltip.show();
      this.setState({tooltip: new_tooltip});
    }
  },
  componentDidMount: function() {
   // let t = new Opentip(this.refs.foo, "banana", "bananaasdas foster");
    //this.setState({tooltip: t});
  },
  render: function() {
    let style;
    let tooltip;
    let pointer = {pointerEvents: "auto"};
    if(this.props.id === this.props.hilight.toString()){
        style = {color: "magenta"};
        if(this.props.tooltip && !this.state.tt){
            //this.state.tooltip.show();
            //this.setState({tt: true})
            //console.log(tooltip);
            //tooltip = <ReactTooltip id={this.props.id} place="top" effect="solid"> <form onSubmit={this.callback}><input id="text_box" type="text" value={this.state.value} onChange={this.handleChange} /></form> </ReactTooltip>; 
            //ReactTooltip.show(this.refs.foo);
        } 
    } else if (this.props.selected && this.props.selected.indexOf(parseInt(this.props.id)) > -1) {
        style = {color: "blue"};
    } else if (this.props.speaker === "Griffin") {
        style = {color: "green"};
    } else {
        style = {color: "black"};
    }
    let inline = {display: "inline"};
    return (
     <div style={inline}>
      <a style={style} id={this.props.id} ref='foo' data-tip  data-for={this.props.id}>
          {this.props.text} { " " }
      </a>
      </div>
    );
  }
});

var WordList = React.createClass({
  render: function() {
    var wordNodes = this.props.data.map((word) => {
      return (
        <Word id={word.id} text={word.text} tooltip={this.props.tooltip} formCB={this.props.formCB} selected={this.props.selected} speaker={word.speaker} hilight={this.props.hilight}>
        </Word>
      );
    });
    let style = {display: "inline"};
    return (
      <div style={style} className="wordList" class="entries">
        {wordNodes}
      </div>
    );
  }
});

export default TextContainer
