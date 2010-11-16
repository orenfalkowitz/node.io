// This module checks a domain's Google pagerank (rate limits obviously apply)
//
//   1. To find the rank of a domain for a given keyword:
//       $ echo "mastercard.com" | node.io -s google_pagerank    
//          => mastercard.com,7

var Job = require('../').Job;

exports.job = new Job({timeout:10, retries:3}, {

    run: function google(input) {
        var self = this;
        
        var url = input;
        if (!~url.indexOf('http://')) url = 'http://'+url;
        
        var ch = '6'+GoogleCH(strord('info:'+url));
        
        this.get('http://www.google.com/search?client=navclient-auto&ch='+ch+'&features=Rank&q=info:'+encodeURIComponent(url), function(err, data) {
            if (err) self.retry();
                       
            if (!~data.indexOf('Rank_1:1:')) {
                self.emit(input+',');
            } else {
                self.emit(input+','+data.substr(9));
            }
        });        
    }, 
    
    fail: function(input) {
        this.emit(input+',');
    }

});

function zF(a,b) {
    var z = parseInt(80000000,16);
    if (z & a) {
        a = a>>1;
        a &=~z;
        a |= 0x40000000;
        a = a>>(b-1);
    } else {
        a = a>>b;
    }
    return(a);
}

function mix(a,b,c) { 
    a-=b; a-=c; a^=(zF(c,13));
    b-=c; b-=a; b^=(a<<8);
    c-=a; c-=b; c^=(zF(b,13));
    a-=b; a-=c; a^=(zF(c,12));
    b-=c; b-=a; b^=(a<<16);
    c-=a; c-=b; c^=(zF(b,5));
    a-=b; a-=c; a^=(zF(c,3));
    b-=c; b-=a; b^=(a<<10);
    c-=a; c-=b; c^=(zF(b,15));
    return (new Array((a),(b),(c)));
}
function GoogleCH(url,length) {
    if(arguments.length == 1) length=url.length;
    var a=0x9E3779B9, b=0x9E3779B9, c=0xE6359A60, k=0, len=length, mx=new Array();
    while(len>=12) { 
        a+=(url[k+0]+(url[k+1]<<8)+(url[k+2]<<16)+(url[k+3]<<24));
        b+=(url[k+4]+(url[k+5]<<8)+(url[k+6]<<16)+(url[k+7]<<24));
        c+=(url[k+8]+(url[k+9]<<8)+(url[k+10]<<16)+(url[k+11]<<24));
        mx=mix(a,b,c);
        a=mx[0]; b=mx[1]; c=mx[2]; 
        k+=12; len-=12;
    }
    c+=length;
    switch(len) { 
        case 11: c+=url[k+10]<<24;
        case 10: c+=url[k+9]<<16;
        case 9:c+=url[k+8]<<8;
        case 8:b+=(url[k+7]<<24);
        case 7:b+=(url[k+6]<<16);
        case 6:b+=(url[k+5]<<8);
        case 5:b+=(url[k+4]);
        case 4:a+=(url[k+3]<<24);
        case 3:a+=(url[k+2]<<16);
        case 2:a+=(url[k+1]<<8);
        case 1:a+=(url[k+0]);
    }
    mx=mix(a,b,c);
    if(mx[2]<0) {
        return(0x100000000+mx[2]);
    } else { 
        return(mx[2]);
    }
}
function strord(string) { 
    var result=new Array();
    for(i=0;i<string.length;i++){
        result[i]=string[i].charCodeAt(0);
    }
    return(result);
}