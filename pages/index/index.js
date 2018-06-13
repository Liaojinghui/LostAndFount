//index.js
//获取应用实例
var app = getApp()

const Http = require('../../utils/http.js');
const util = require('../../utils/util.js')
Page({
  data: {
    open: false,
    scale: 18,
    latitude: 0,
    longitude: 0,
    markers: [],
    userInfo: null,
    map: false,
    animation: {},
    opacity: 1,
    animDetail: {},
    detailOpen: false,
    detail: {}
  },
  // 页面加载
  async onLoad(options) {
    this.getLocation();
    this.setMapController();
  },
  // 页面显示
  onShow() {
    // 1.创建地图上下文，移动当前位置到地图中心
    this.mapCtx = wx.createMapContext("lafMap");
    this.movetoPosition()
  },
  // 地图控件点击事件
  controltap(e) {
    console.log(e.controlId)

    // 判断点击的是哪个控件 e.controlId代表控件的id，在页面加载时的第3步设置的id
    switch (e.controlId) {
      // 点击定位控件
      case 1:
        this.movetoPosition();
        break;
      case 2:
        wx.navigateTo({
          url: '../postlost/postlost',
        })
        break;
      case 3:
        wx.navigateTo({
          url: '../postfound/postfound',
        })
        break;
      case 4:
        //list
        console.log('ccc')
        this.onTapSlide()
        break;
      case 5:
        break;
      case 6:
        wx.navigateTo({
          url: '../mine/mine',
        })
        break;
      default:
        break;
    }
  },
  // 地图视野改变事件
  bindregionchange(e) {
    // 拖动地图，获取附件单车位置
    if (e.type == "begin") {
      this.onDetail(0, true);
    } else if (e.type == "end") { }
  },
  // 地图标记点击事件，连接用户位置和点击的单车位置
  bindmarkertap(e) {
    console.log(e);

    let _markers = this.data.markers;
    let markerId = e.markerId;
    let currMaker = _markers[markerId];
    if (currMaker.detail.date.label === '捡到时间') {
      this.onDetail(-320);
    } else {
      this.onDetail(-280);
    }
    this.setData({
      detail: currMaker.detail,
      polyline: [{
        points: [{
          longitude: this.data.longitude,
          latitude: this.data.latitude
        }, {
          longitude: currMaker.longitude,
          latitude: currMaker.latitude
        }],
        color: "#FF0000DD",
        width: 1,
        dottedLine: true
      }],
      scale: 18
    })
  },
  // 定位函数，移动位置到地图中心
  movetoPosition: function () {
    this.mapCtx.moveToLocation();
  },
  setMapController() {
    // 3.设置地图控件的位置及大小，通过设备宽高定位
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          controls: [{
            id: 1,
            iconPath: '/images/location.png',
            position: {
              left: 10,
              top: res.windowHeight - 106,
              width: 50,
              height: 50
            },
            clickable: true
          },
          {
            id: 2,
            iconPath: '/images/forlost.png',
            position: {
              left: res.windowWidth / 2 - 150,
              top: res.windowHeight - 55,
              width: 150,
              height: 45
            },
            clickable: true
          },
          {
            id: 3,
            iconPath: '/images/forfound.png',
            position: {
              left: res.windowWidth / 2,
              top: res.windowHeight - 55,
              width: 150,
              height: 45
            },
            clickable: true
          },
          {
            id: 4,
            iconPath: '/images/list.png',
            position: {
              left: 10,
              top: 61,
              width: 50,
              height: 50
            },
            clickable: true
          },
          {
            id: 5,
            iconPath: '/images/marker.png',
            position: {
              left: res.windowWidth / 2 - 11,
              top: res.windowHeight / 2 - 45,
              width: 20,
              height: 30
            },
            clickable: true
          },
          {
            id: 6,
            iconPath: '/images/Mine.png',
            position: {
              left: 10,
              top: 10,
              width: 50,
              height: 50
            },
            clickable: true
          }
          ]
        })
      }
    });
  },
  async setMarkers(res, markers, isLost = false) {

    for (let i = 0; i < res.length; i++) {
      res[i]['id'] = markers.length + i;
      let latitude = parseFloat(res[i]['altitude'] + '');
      let longitude = parseFloat(res[i]['longitude'] + '');
      let icon = '../' + res[i]['iconPath'];
      let location = res[i]['location'];
      let Type = util.TYPE[parseInt(res[i]['type_num'])];

      let detail = {
        'good': {
          'label': '物品',
          'value': Type
        },
        'location': {
          label: '地点',
          value: location
        },
        'image': 'http://39.105.118.89:7777/upload/wx8fb6b0e11d78879f.o6zAJs95U8q9TezXCAICTK0P3Fig.rzJMizAmeyFl06a54f8751998dd7fd846b46ca1f88b5.png',//res[i]['image'],
        'tel': res[i]['tel'],
        'note': res[i]['note']
      };
      if (isLost) {
        detail['date'] = {
          label: '丢失时间',
          value: res[i]['lost_date']
        }
      } else {
        detail['date'] = {
          label: '捡到时间',
          value: res[i]['found_date']
        }
        detail['pick_location'] = {
          label: '领取地点',
          value: res[i]['pick_location']
        }
      }
      if (latitude > 90 || latitude < -90) {
        continue;
      }
      let marker = {
        iconPath: icon,
        id: i,
        latitude: latitude,
        longitude: longitude,
        width: 30,
        height: 30,
        detail: detail
      }
      markers.push(marker)
    }
    return markers;
  },
  getLocation() {
    let that = this;
    // 2.获取并设置当前位置经纬度
    wx.getLocation({
      type: "gcj02",
      success: async (res) => {
        console.log(res)
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
        that.getMarkers(res.latitude, res.longitude);
      }
    });
  },
  async getMarkers(latitude, longitude) {
    let markers = new Array()
    let res = await Http.getFounds(null, latitude, longitude);
    this.setMarkers(res, markers);
    let res2 = await Http.getLosts(null, latitude, longitude);
    this.setMarkers(res2, markers, -1);
    console.log(markers)
    this.setData({
      markers: markers,
      map: true
    })
  },
  onTapSlide() {
    console.log('00')
    let that = this
    if (this.data.open) {
      let animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'ease-in-out'
      })
      animation.translateX(0).step();
      this.setData({
        animation: animation.export(),
        open: false,
        opacity: 1
      })
    } else {
      let animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'ease-in-out'
      })
      animation.translateX(200).step();
      this.setData({
        animation: animation.export(),
        open: true

      })
      setTimeout(() => {
        that.setData({
          opacity: 0.9
        })
      }, 100)
    }
  },
  onDetail(distance, isHide = false) {
    //已经展开 判断是要更新数据还是直接隐藏
    if (this.data.detailOpen) {
      let animation = wx.createAnimation({
        duration: 100,
        timingFunction: 'ease-in-out'
      })

      //直接隐藏
      if (isHide) {
        animation.translateY(0).step();
        this.setData({
          animDetail: animation.export(),
          detailOpen: false
        })
      } else { //更新数据 不更改open参数
        animation.translateY(0).step().translateY(distance).step();
        this.setData({
          animDetail: animation.export()
        })
      }

    } else {
      //当前处于隐藏状态
      let animation = wx.createAnimation({
        duration: 100,
        timingFunction: 'ease-in-out'
      })

      //判断是继续隐藏 还是打开
      if (isHide) {

      } else {
        animation.translateY(distance).step();
        this.setData({
          animDetail: animation.export(),
          detailOpen: true
        })
      }
    }
  }, onCall(e) {
  }, onPreview(e){
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url],
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  }
})