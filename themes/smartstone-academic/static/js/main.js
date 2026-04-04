(function () {
  var root = document.documentElement;

  var getHeaderOffset = function () {
    var header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().height : 0;
  };

  var menuToggle = document.getElementById("menu-toggle");
  var menuList = document.getElementById("menu-list");
  if (menuToggle && menuList) {
    menuToggle.addEventListener("click", function () {
      var expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      menuList.classList.toggle("open");
    });
  }

  var progress = document.getElementById("reading-progress");
  if (progress) {
    var progressTicking = false;
    var updateProgress = function () {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var width = height > 0 ? (scrollTop / height) * 100 : 0;
      progress.style.width = width + "%";
      progressTicking = false;
    };
    var requestProgressUpdate = function () {
      if (!progressTicking) {
        window.requestAnimationFrame(updateProgress);
        progressTicking = true;
      }
    };
    requestProgressUpdate();
    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate);
  }

  var articleContent = document.getElementById("article-content");
  if (!articleContent) {
    return;
  }

  var setupTocHighlight = function () {
    var headingNodes = articleContent.querySelectorAll("h2[id], h3[id], h4[id]");
    if (!headingNodes.length) {
      return;
    }

    var desktopLinks = document.querySelectorAll(".article-toc a[href^='#']");
    var mobileLinks = document.querySelectorAll(".article-toc-mobile a[href^='#']");
    var allLinks = Array.prototype.slice.call(desktopLinks).concat(Array.prototype.slice.call(mobileLinks));
    if (!allLinks.length) {
      return;
    }

    var sectionProgressBar = document.getElementById("section-progress-bar");
    var desktopToc = document.querySelector(".article-toc");
    var headingOrder = [];
    var activeId = null;

    var getOffsetWithin = function (node, container) {
      var top = 0;
      var current = node;
      while (current && current !== container) {
        top += current.offsetTop;
        current = current.offsetParent;
      }
      return top;
    };

    var linkMap = {};
    allLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      if (href.length > 1) {
        var id = decodeURIComponent(href.slice(1));
        if (!linkMap[id]) {
          linkMap[id] = [];
        }
        linkMap[id].push(link);
      }
    });

    var updateSectionProgress = function (id) {
      if (!sectionProgressBar) {
        return;
      }
      if (!headingOrder.length) {
        sectionProgressBar.style.width = "0%";
        return;
      }
      var index = headingOrder.indexOf(id);
      if (index < 0) {
        sectionProgressBar.style.width = "0%";
        return;
      }
      sectionProgressBar.style.width = (((index + 1) / headingOrder.length) * 100) + "%";
    };

    var setActive = function (id) {
      if (!id || activeId === id) {
        return;
      }
      activeId = id;
      allLinks.forEach(function (link) {
        link.classList.remove("active");
      });
      if (linkMap[id]) {
        linkMap[id].forEach(function (link) {
          link.classList.add("active");
        });
      }
      updateSectionProgress(id);
      if (desktopToc && linkMap[id]) {
        var targetLink = null;
        for (var i = 0; i < linkMap[id].length; i += 1) {
          if (linkMap[id][i].closest(".article-toc")) {
            targetLink = linkMap[id][i];
            break;
          }
        }
        if (targetLink) {
          var topPadding = 42;
          var bottomPadding = 18;
          var linkTop = getOffsetWithin(targetLink, desktopToc);
          var linkBottom = linkTop + targetLink.offsetHeight;
          var viewTop = desktopToc.scrollTop + topPadding;
          var viewBottom = desktopToc.scrollTop + desktopToc.clientHeight - bottomPadding;
          if (linkTop < viewTop) {
            desktopToc.scrollTop = Math.max(linkTop - topPadding, 0);
          } else if (linkBottom > viewBottom) {
            desktopToc.scrollTop = linkBottom - desktopToc.clientHeight + bottomPadding;
          }
        }
      }
    };

    var scrollToHeading = function (id) {
      var target = document.getElementById(id);
      if (!target) {
        return;
      }
      var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset() - 16;
      window.scrollTo({ top: top, behavior: "smooth" });
      history.replaceState(null, "", "#" + encodeURIComponent(id));
    };

    var closeMobileToc = function () {
      var mobileToc = document.querySelector(".article-toc-mobile");
      if (mobileToc && mobileToc.hasAttribute("open")) {
        mobileToc.removeAttribute("open");
      }
    };

    allLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href") || "";
        if (href.length <= 1) {
          return;
        }
        event.preventDefault();
        var id = decodeURIComponent(href.slice(1));
        setActive(id);
        scrollToHeading(id);
        closeMobileToc();
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    headingNodes.forEach(function (heading) {
      headingOrder.push(heading.id);
      observer.observe(heading);
    });

    setActive(headingNodes[0].id);

    window.addEventListener("resize", function () {
      if (activeId) {
        updateSectionProgress(activeId);
      }
    });
  };

  var setupCodeBlocks = function () {
    var codeBlocks = articleContent.querySelectorAll("pre > code");
    if (!codeBlocks.length) {
      return;
    }

    var lineButtons = [];
    var foldButtons = [];
    var linesEnabled = localStorage.getItem("pref-code-lines") === "true";
    var foldEnabled = localStorage.getItem("pref-code-fold") === "true";

    var applyLineNumberState = function () {
      root.classList.toggle("show-line-numbers", linesEnabled);
      lineButtons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(linesEnabled));
        btn.textContent = linesEnabled ? "隐藏行号" : "显示行号";
      });
    };

    var applyFoldState = function () {
      root.classList.toggle("code-folded", foldEnabled);
      foldButtons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(foldEnabled));
        btn.textContent = foldEnabled ? "展开代码" : "折叠代码";
      });
    };

    var detectLanguage = function (code) {
      var classes = code.className || "";
      var matched = classes.match(/language-([\w#+-]+)/i);
      return matched && matched[1] ? matched[1].toLowerCase() : "text";
    };

    var formatLanguageLabel = function (lang) {
      if (lang === "cpp" || lang === "c++") {
        return "C++";
      }
      if (lang === "js") {
        return "JavaScript";
      }
      if (lang === "sh") {
        return "bash";
      }
      return lang;
    };

    var classifyCppTokens = function (code) {
      var names = code.querySelectorAll("span.n");
      names.forEach(function (token) {
        var text = (token.textContent || "").trim();
        if (!text) {
          return;
        }

        token.classList.remove("tok-type", "tok-var", "tok-call");

        if (/^[A-Z_]/.test(text)) {
          token.classList.add("tok-type");
        } else {
          token.classList.add("tok-var");
        }

        var next = token.nextElementSibling;
        if (next && next.classList.contains("p") && (next.textContent || "").trim().charAt(0) === "(") {
          token.classList.add("tok-call");
        }
      });
    };

    var buildLineNumbers = function (code) {
      var raw = (code.textContent || "").replace(/\n$/, "");
      var lineCount = raw ? raw.split("\n").length : 1;
      var lines = [];
      for (var i = 1; i <= lineCount; i += 1) {
        lines.push(String(i));
      }
      return lines.join("\n");
    };

    var copyText = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        try {
          var textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "readonly");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          var success = document.execCommand("copy");
          document.body.removeChild(textarea);
          if (success) {
            resolve();
          } else {
            reject(new Error("copy failed"));
          }
        } catch (error) {
          reject(error);
        }
      });
    };

    codeBlocks.forEach(function (code) {
      var pre = code.parentElement;
      if (!pre || pre.dataset.enhanced === "true") {
        return;
      }

      var toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";

      var langName = detectLanguage(code);
      if (langName === "cpp" || langName === "c++") {
        classifyCppTokens(code);
      }
      var lang = document.createElement("span");
      lang.className = "code-lang";
      lang.classList.add("code-lang-" + langName.replace(/[^a-z0-9_-]+/g, "-"));
      lang.textContent = formatLanguageLabel(langName);

      var actions = document.createElement("div");
      actions.className = "code-actions";

      var lineButton = document.createElement("button");
      lineButton.type = "button";
      lineButton.className = "code-lines-btn";
      lineButton.setAttribute("aria-label", "切换行号显示");
      lineButton.addEventListener("click", function () {
        linesEnabled = !linesEnabled;
        localStorage.setItem("pref-code-lines", String(linesEnabled));
        applyLineNumberState();
      });
      lineButtons.push(lineButton);

      var foldButton = document.createElement("button");
      foldButton.type = "button";
      foldButton.className = "code-fold-btn";
      foldButton.setAttribute("aria-label", "切换代码折叠");
      foldButton.addEventListener("click", function () {
        foldEnabled = !foldEnabled;
        localStorage.setItem("pref-code-fold", String(foldEnabled));
        applyFoldState();
      });
      foldButtons.push(foldButton);

      var copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "code-copy-btn";
      copyButton.textContent = "复制";
      copyButton.setAttribute("aria-label", "复制代码");
      copyButton.addEventListener("click", function () {
        var raw = code.innerText || code.textContent || "";
        copyText(raw).then(function () {
          copyButton.textContent = "已复制";
          window.setTimeout(function () {
            copyButton.textContent = "复制";
          }, 1200);
        }).catch(function () {
          copyButton.textContent = "复制失败";
          window.setTimeout(function () {
            copyButton.textContent = "复制";
          }, 1200);
        });
      });

      var gutter = document.createElement("span");
      gutter.className = "code-line-gutter";
      gutter.setAttribute("aria-hidden", "true");
      gutter.textContent = buildLineNumbers(code);

      actions.appendChild(lineButton);
      actions.appendChild(foldButton);
      actions.appendChild(copyButton);
      toolbar.appendChild(lang);
      toolbar.appendChild(actions);

      pre.classList.add("has-toolbar");
      pre.classList.add("code-lines-ready");
      pre.insertBefore(toolbar, code);
      pre.insertBefore(gutter, code);
      pre.dataset.enhanced = "true";
    });

    applyLineNumberState();
    applyFoldState();
  };

  var setupImageLightbox = function () {
    var images = articleContent.querySelectorAll("img");
    if (!images.length) {
      return;
    }

    var imageList = Array.prototype.slice.call(images);
    var activeImageIndex = -1;
    var overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "图片预览");
    overlay.innerHTML =
      '<button class="image-lightbox-nav prev" type="button" aria-label="上一张">‹</button>' +
      '<button class="image-lightbox-nav next" type="button" aria-label="下一张">›</button>' +
      '<button class="image-lightbox-close" type="button" aria-label="关闭预览">关闭</button>' +
      '<img class="image-lightbox-image" alt="">' +
      '<p class="image-lightbox-caption"></p>';
    document.body.appendChild(overlay);

    var overlayImage = overlay.querySelector(".image-lightbox-image");
    var overlayCaption = overlay.querySelector(".image-lightbox-caption");
    var closeButton = overlay.querySelector(".image-lightbox-close");
    var prevButton = overlay.querySelector(".image-lightbox-nav.prev");
    var nextButton = overlay.querySelector(".image-lightbox-nav.next");

    var closeOverlay = function () {
      overlay.classList.remove("open");
      document.body.classList.remove("lightbox-open");
      overlayImage.src = "";
      overlayImage.alt = "";
      overlayCaption.textContent = "";
      activeImageIndex = -1;
    };

    var showByIndex = function (index) {
      if (index < 0 || index >= imageList.length) {
        return;
      }
      activeImageIndex = index;
      var target = imageList[index];
      overlayImage.src = target.currentSrc || target.src;
      overlayImage.alt = target.alt || "图片";
      overlayCaption.textContent = target.alt || "";
      overlay.classList.add("open");
      document.body.classList.add("lightbox-open");
    };

    var showPrev = function () {
      if (!imageList.length) {
        return;
      }
      var prev = activeImageIndex - 1;
      if (prev < 0) {
        prev = imageList.length - 1;
      }
      showByIndex(prev);
    };

    var showNext = function () {
      if (!imageList.length) {
        return;
      }
      showByIndex((activeImageIndex + 1) % imageList.length);
    };

    if (imageList.length <= 1) {
      prevButton.disabled = true;
      nextButton.disabled = true;
    }

    images.forEach(function (img, idx) {
      img.classList.add("zoomable");
      img.addEventListener("click", function () {
        showByIndex(idx);
      });
    });

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeOverlay();
      }
    });

    closeButton.addEventListener("click", closeOverlay);
    prevButton.addEventListener("click", function (event) {
      event.stopPropagation();
      showPrev();
    });
    nextButton.addEventListener("click", function (event) {
      event.stopPropagation();
      showNext();
    });

    document.addEventListener("keydown", function (event) {
      if (!overlay.classList.contains("open")) {
        return;
      }
      if (event.key === "Escape") {
        closeOverlay();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      }
    });
  };

  var setupTocTopButton = function () {
    var buttons = document.querySelectorAll("[data-toc-top]");
    if (!buttons.length) {
      return;
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var target = document.querySelector(".article-head");
        if (!target) {
          return;
        }
        var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset() - 12;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  };

  var setupTocWheelIsolation = function () {
    var toc = document.querySelector(".article-toc");
    if (!toc) {
      return;
    }
    toc.addEventListener(
      "wheel",
      function (event) {
        event.preventDefault();
        var unit = 1;
        if (event.deltaMode === 1) {
          unit = 16;
        } else if (event.deltaMode === 2) {
          unit = toc.clientHeight;
        }
        toc.scrollTop += event.deltaY * unit;
      },
      { passive: false }
    );
  };

  setupTocHighlight();
  setupImageLightbox();
  setupCodeBlocks();
  setupTocTopButton();
  setupTocWheelIsolation();
})();
