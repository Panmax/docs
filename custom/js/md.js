// Init scrollStopped jQuery plugin
$.fn.scrollStopped = function(callback) {
  $(this).scroll(function() {
    var self = this, $this = $(self);
    if ($this.data('scrollTimeout')) {
      clearTimeout($this.data('scrollTimeout'));
    }
    $this.data('scrollTimeout', setTimeout(callback, 250, self));
  });
};

// Init TOC
+function() {
  $("h1,h2,h3,h4,h5,a").removeAttr("id");

  gajus.contents.formatId = function(str){
    if(/^[0-9]/.test(str)){
      str = "_"+str;
    }
    return str.replace(/ /g,'_').replace(/[^a-zA-Z_0-9\u4e00-\u9fa5]/g,'_');
  };

  var tocContents = gajus.contents({
    contents: document.querySelector('#toc-wrapper')
  });

  // Add essential classes
  $('#toc-wrapper ol').first().attr('id','toc');
  $('#toc').addClass('nav');

  tocContents.eventProxy.on('ready', function () {
    doSideBar();
  });
}();

var SidebarAffixShadow = $('.sidebar-affix-shadow');
var updateSidebarAffixShadowWidth = function() {
  var tocWidth = $('#left-nav').width();
  SidebarAffixShadow.removeClass('bottom').addClass('on').attr('data-width', tocWidth);
  $('style[title=css-sidebar-affix-shadow-width]').remove();
  $('head').append('<style title=css-sidebar-affix-shadow-width>.sidebar-affix-shadow:before, .sidebar-affix-shadow:after {width: ' + tocWidth + 'px;}</style>');
  $('#toc-wrapper').width(tocWidth);
}

// Sidebar affix
var doSideBar = function(){
  $('.sidebar-wrapper').affix({
    offset: {
      top: 80
    , bottom: function () {
        return (this.bottom = $('.footer').outerHeight(true))
      }
    }
  })
  .on('affix.bs.affix', function (e) {
    updateSidebarAffixShadowWidth();
  })
  .on('affix-top.bs.affix', function (e) {
    // If scrolls back to top
    $('#toc-wrapper').removeAttr('style');
    SidebarAffixShadow.removeClass('bottom on');
  })
  .on('affix-bottom.bs.affix', function (e) {
    // If window reaches bottom (Affix style)
    SidebarAffixShadow.addClass('bottom').removeClass('on');
  });
}

var updateScrollSpy = function() {
  if(window.location.hash){//因为 dom改变导致 hash位置不正确，需要进行重新定位
    window.location=window.location.hash;
  }
  //定位完成后再添加 scrollspy 功能
  setTimeout(function(){
    $('body').scrollspy({ target: '.sidebar-wrapper' })
  }, 200)
}

// Add a hover class to detect if users mouse is hovering over the sidebar
var addSidebarHoverListener = function() {
  $(".sidebar-affix-shadow").hover(
    function() {
      $(this).removeClass("sidebar-hover-off");
    }, function() {
      $(this).addClass("sidebar-hover-off");
    }
  );
}

// Smooth scrolling, disabled by default
var initSmoothScroll = function() {
  // Bind to the click of all links with a #hash in the href
  $('a[href^="#"]').click(function(e) {
    // Prevent the jump and the #hash from appearing on the address bar
    e.preventDefault();
    // Scroll the window, stop any previous animation, stop on user manual scroll
    // Check https://github.com/flesler/jquery.scrollTo for more customizability
    $(window).stop(true).scrollTo(this.hash, {duration: 400, interrupt: true});
  });
}

// Init GitHub links
var initGitHubLinks = function() {
  var currentPath = window.location.pathname.match(/.*\/(.+).html/i)[1];
  $("#content").prepend("<div class=docs-meta>\
      <span class='icon icon-github'></span>\
      <a href='http://github.com/leancloud/docs/blob/master/md/" + currentPath + ".md'>在 GitHub 查看</a>\
      |\
      <a href='http://github.com/leancloud/docs/commits/master/md/" + currentPath + ".md'>文件历史</a>\
      |\
      <a href='http://github.com/leancloud/docs/edit/master/md/" + currentPath + ".md'>编辑</a>\
    </div>");
  $(".sidebar-wrapper #toc").append("<li class=sidebar-meta><a href='#' class=do-expand-all>展开所有</a> <a href='#top' class=back-to-top>返回顶部</a></li>");
}

// Init GitHub contributors
function getGitHubContributors() {
  var currentPath = window.location.pathname.match(/.*\/(.+).html/i)[1];
  var url = "https://api.github.com/repos/leancloud/docs/commits?path=md/" + currentPath + ".md&per_page=10000000"
  var contributors = [];
  var appendTarget = $("#content h1");
  $.getJSON(url, function(data) {
    $.each(data, function(index, item) {
      if(item.author) {
        contributors.push({
          handle: item.author.login,
          url: item.author.html_url,
          avatar: item.author.avatar_url
        });
      }
    });
  })
  .done(function() {
    // Make contributor array of objects unique
    var uniqArr = {};
    for ( var i=0, n=contributors.length; i < n; i++ ) {
      var item = contributors[i];
      uniqArr[item.handle] = item;
    }

    contributors = new Array();
    for ( var key in uniqArr ) {
      contributors.push(uniqArr[key]);
    }

    if($.isEmptyObject(contributors)) {
      return;
    }
    else {
      $("<ul />", {
        "class": "github-contributors"
      }).insertAfter(appendTarget);

      $(".doc-content h1").addClass("github-contributors-loaded");

      var wrap = $(".github-contributors");

      $.each(contributors, function(index, item) {
        $("<li />").append(
          $("<a />", {
            "href": item.url,
            "data-title": item.handle
          }).append(
            $("<img />", {
              "src": item.avatar,
              "alt": item.handle
            })
          )
        ).appendTo(wrap);
      });

      $(wrap).find("a").tooltip();
    }

    console.log("fetch contributors success");
  })
  .fail(function() { console.log("fetch contributors error"); })
  .always(function() { console.log("fetch contributors complete"); });
}

function sidebarExpandAll() {
  var el = $(".do-expand-all");
  var target = $(".sidebar-wrapper");

  el.on("click", function(e) {
    e.preventDefault();
    target.toggleClass("expand-all");
    $(this).text(function(i, t) {
      return t === '展开所有' ? '折叠所有' : '展开所有'
    });
  });
}

var initScrollHistoryState = function() {
  var activeItem = $("#toc li .active").last().find("a").attr("href");
  if (typeof activeItem === 'undefined') {
    activeItem = "";
  }

  // Will change URL without reloading, affecting the history
  history.replaceState("data", "title", location.origin + location.pathname + activeItem);
  console.log(location.origin + location.pathname + activeItem);
}

$(function() {
  prettyPrepare(); // prepare elements that need to be prettified
  refactDom();//
  prettyPrint(updateScrollSpy);
  glueCopy();
  updateScrollSpy();
  addSidebarHoverListener();
  initGitHubLinks();
  sidebarExpandAll();
  getGitHubContributors();
  // initSmoothScroll();

  var arr = $('#toc ul').parents('li');
  angular.forEach(arr, function(v, k) {
    var a = $(v).children('a:first-child');
    a.addClass('has-subdoc-nav');
  });

  setTimeout(function() {
    updateSidebarAffixShadowWidth();
  }, 400);
});

// If the cursor is off the sidebar, scrolls to parent active heading
$(window).scrollStopped(function() {
  var activeToc = $("#toc > li .active").first();
  if (activeToc.length === 0) {
    activeToc = $("#toc > li:first-child");
  }

  setTimeout(function() {
    $(".sidebar-affix-shadow.on.sidebar-hover-off .sidebar-wrapper").scrollTo(activeToc, 800, {offset: -20});
    // console.log("Haven't scrolled in 250ms, fired in 250ms later.");
    updateSidebarAffixShadowWidth();
    initScrollHistoryState();
  }, 200);
});

$(window).resize(function() {
  updateSidebarAffixShadowWidth();
});
