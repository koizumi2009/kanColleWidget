/***** class definitions *****/

function MyStorage(){};

MyStorage.prototype.get = function(key){

    if (sessionStorage.isTest == 'true') return MyStorage.ofTest().get(key);

    try{
        return JSON.parse(localStorage.getItem(key));
    }catch(e){
        return localStorage.getItem(key);
    }
};
// set呼ばれ過ぎ問題？
MyStorage.prototype.set = function(key,value){

    if (sessionStorage.isTest == 'true') return MyStorage.ofTest().set(key,value);

    if (this.get('config')['sync-multi-devices']) this.sync.save();

    return localStorage.setItem(key,JSON.stringify(value));
};

MyStorage.prototype.sync = (function(){
    var myStorage = new MyStorage();
    var lastSavedTime = 0;
    var _save = function(cb){
            if (typeof cb !== 'function') cb = function(){};
            if (Date.now() - lastSavedTime < 10*1000) return cb();
            var kvs = {};
            for (var key in localStorage) {
                kvs[key] = localStorage.getItem(key);
            }
            chrome.storage.sync.set(kvs, function(){
                lastSavedTime = Date.now();
                return cb(kvs);
            });
    };
    var _load = function(cb){
        if (typeof cb !== 'function') cb = function(){};
        chrome.storage.sync.get(null, function(items){
            for (var key in items) {
                myStorage.set(key, JSON.parse(items[key]));
            }
            return cb(items);
        });
    };
    return {
        save: _save,
        load: _load
    };
})();

MyStorage.ofTest = function(){
    var self = new MyStorage();
    self.isTest = true;
    sessionStorage.isTest = true;
    // overwrite basic methods
    self.get = function(key){
        try{
            return JSON.parse(sessionStorage.getItem(key));
        }catch(e){
            return sessionStorage.getItem(key);
        }
    };
    self.set = function(key, value){
        sessionStorage.setItem(key,JSON.stringify(value));
    };
    return self;
};
MyStorage.prototype.tearDown = function(){
    if (this.isTest) {
        sessionStorage.clear();
        return true;
    }
    return false;
};

/* static */var Config = {/** localStorage.configにアクセスするstaticなクラス **/

    /* private */storage : new MyStorage(),
    /* private */initial : {
        'announce-already-read'              : 0,
        'badge-left-time'                    : true,
        'record-achievements'                : false,
        //'enable-manual-reminder'           : false, //Obsolete!!
        'enable-dynamic-reminder'            : false,
        'popup-select-title'                 : '',
        'notification-img-file'              : '',
        'notification-sound-file'            : '',
        'notification-sound-volume'          : '100',
        'notification-mission-end-suffix'    : '',
        'notification-nyukyo-end-suffix'     : '',
        'notification-createship-end-suffix' : '',
        //'enable-notification'              : false, // Obsolete!!
        'notification-on-reminder-set'       : true,
        'notification-on-reminder-finish'    : true,
        'notification-offset-millisec'       : 60*1000,//デフォルトでは1分前
        'enable-screen-shot'                 : false,
        'capture-destination-size'           : true, // とりあえず今はbool
        'capture-image-format'               : 'jpeg',
        'capture-image-filename-prefix'      : 'kancolle',
        'capture-image-download-dir'         : '艦これ',
        'launch-on-click-notification'       : true,
        'show-clockmode-button'              : true,
        'download-on-screenshot'             : false,
        'notification-stay-visible'          : '',
        'enable-mission-reminder'            : true,
        'dynamic-reminder-type'              : 0,
        'allow-ocr-result-log'               : false,
        'share-kousyo-result'                : false,
        'tiredness-recovery-minutes'         : 0,
        'prevent-forgetting-quest'           : true,
        'display-maintenance-info'           : false,
        'clockmode-style'                    : 1,
        'timer-format-remained-time'         : false,
        'show-ships-status'                  : false,
        'show-old-launch'                    : true,//でも基本的にはこれはfalseを期待
        'text-on-mission-start'              : 'ふなでだぞー',
        'modify-original-tab'                : false,
        'use-white-mode-as-default'          : false,
        'hide-adressbar-in-safemode'         : false,
        'sync-multi-devices'                 : false,
        'sort-by-finishtime'                 : false
    },

    /* public: dict */repair : function(){
        var config = this.storage.get('config') || this.initial;
        for(var key in this.initial){
            if(config[key] == null){
                config[key] = this.initial[key];
            }
        }
        this.storage.set('config', config);
        return config;
    },
    /* public: dict */getJSON : function(){
    	var config = this.repair() || this.initial;
    	return config;
    },
    /* public: bool */updateAll : function(dict){
        this.storage.set('config', dict);
    },
    /* public: * */get : function(key){
        var config = this.getJSON();
        return config[key];
    },
    /* public: bool */set : function(key,value){
        var config = this.getJSON();
        config[key] = value;
        this.storage.set('config', config);
        return true;
    }
};

/* static */var Tracking = {/** localStorage.inputTrackingにアクセスするstaticなクラス **/

    /* private */storage : new MyStorage(),
    /* private */initial : {
        mode : 'm',
        widget : {
            position : {
                left : 50,
                top  : 50
            },
            size : {
                height: 0,
                width : 0
            }
        },
        dashboard: {
            position: {
                left: 200,
                top:  200
            },
            size : {
                width:  420,
                height: 250
            }
        },
        createship : {
            hour   :  1,
            minute : 30
        },
        nyukyo : {
            hour   :  1,
            minute : 30
        },
        statusWindow : {
            position: {
                left : 50,
                top  : 50
            },
            size: {
                height: 215,
                width:  184
            }
        }
    },

    /* public: dict */repair : function(){
        var tracking = this.storage.get('inputTracking') || this.initial;
        for(var key in this.initial){
            if(!tracking[key]){
                tracking[key] = this.initial[key];
            }
        }
        this.storage.set('inputTracking', tracking);
        return tracking;
    },
    /* public: dict */getJSON : function(){
    	var tracking = this.repair() || this.initial;
    	for( var key in this.initial ){
    		if( tracking[key] == undefined ){
    			tracking[key] = this.initial[key];
    		}
    	}
    	return tracking;
    },
    /* public: bool */updateAll : function(dict){
        this.storage.set('inputTracking', dict);
    },
    /* public: * */get : function(key){
        var tracking = this.getJSON();
        return tracking[key];
    },
    /* public: bool */set : function(key,value){
        var tracking = this.getJSON();
        tracking[key] = value;
        this.storage.set('inputTracking', tracking);
        return true;
    }
};
