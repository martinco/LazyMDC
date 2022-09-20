

function login(event) {
  event.preventDefault();

  event.target.classList.add('was-validated');
  if (event.target.checkValidity() !== true) {
    return;
  }

  api_post(
    'user/login',
    {
      'username': $("#login-username").val(),
      'password': $("#login-password").val(),
    },
    function(r) {
      if (!r.success) {
        $('#login-alert').css('visibility','visible').hide().fadeIn();
        console.log('alert');
        return;
      }
      admin_user = r;
      do_login(r);
    }
  );

  console.log("LOGIN");
}

function do_logout() {
  api_get('user/logout', function() {
    $('#header-user-container').fadeOut();
    $('#sidebar').fadeOut(300, function() {
      update_nav();
      $('#sidebar').fadeIn();
      $("a.nav-link[href$=\"#login\"]").tab('show');
    });
  });

}

function nav_item(href, title, icon, url, depth = 0) {

  var url = url || href;

  var html = `<li class="nav-item" style="padding-left:${2*depth}em">
    <a class="nav-link" href="#${href}" `

  if (url) {
    html += `data-url="${url}"`;
  }

  html += `role="tab" data-toggle="pill">
    <span data-feather="${icon}"></span>
    <span class="nav-title">${title}</span>
    </a>
  </li>`

  return $(html);
}

function update_nav(data) {

  // Build side nav and pick default page
  var nav = $('#side-nav');
  nav.empty();

  if (!data || !data.username) {
    nav.append(nav_item('login', 'Login', 'log-in'));
  } else {
    nav.append(nav_item('introduction', 'Introduction', 'help-circle'));

    if (data.roles['theatre-create']) {
      nav.append(nav_item('theatres', 'Theatres', 'globe'));
    }

    nav.append(nav_item('squadrons', 'Squadrons', 'database'));

    if (data.roles['squadrons-create']) {
      nav.append(nav_item('threats', 'Threats', 'alert-triangle'));
    }

    if (data.roles['users-view']) {
      nav.append(nav_item('users', 'Users', 'users'));
    }
  }

  feather.replace();

}

function do_login(data, instant) {

  // Change Logged in user
  $('#header-user-name').text(data.username);

  // If our page is login, move us to a default page
  var page = url_elems().shift();
  if (page == "login") {
    window.history.pushState('page', 'title', "introduction");
  }

  // Change sidebar
  if (instant || false) {
    $('#header-user-container').show();
    update_nav(data);
    update_content();
  } else {
    $('#header-user-container').fadeIn();
    $('#sidebar').fadeOut(300, function() {
      update_nav(data);
      $('#sidebar').fadeIn();
      update_content();
    });
  }
}

$('#login-form').submit(login);
