

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
      do_login(r);
    }
  );

  console.log("LOGIN");
}

function do_logout() {
  api_post('user/logout', {}, function() {
    $('#header-user-container').fadeOut();
    $('#sidebar').fadeOut(300, function() {
      update_nav();
      $('#sidebar').fadeIn();
      $("a.nav-link[href$=\"#login\"]").tab('show');
    });
  });

}

function nav_item(href, title, icon, depth = 0) {
  return $(`<li class="nav-item" style="padding-left:${2*depth}em">
    <a class="nav-link" href="#${href}">
    <span data-feather="${icon}"></span>
    ${title}
    </a>
  </li>`);
}

function update_nav(data) {

  // Build side nav and pick default page
  var nav = $('#side-nav');
  nav.empty();

  if (!data || !data.username) {
    nav.append(nav_item('login', 'Login', 'log-in'));
  } else {
    if (data.permissions.includes('theatre-create')) {
      nav.append(nav_item('theatres', 'Theatres', 'globe'));
    }

    nav.append(nav_item('squadrons', 'Squadrons', 'database'));
    nav.append(nav_item('frequencies', 'Frequency Codes', 'activity', 1));
    nav.append(nav_item('missions', 'Missions', 'crosshair', 1));
    nav.append(nav_item('members', 'Members', 'users', 1));

    if (data.permissions.includes('users-view')) {
      nav.append(nav_item('users', 'Users', 'users'));
    }
  }

  feather.replace();


}

function do_login(data, instant) {

  // Change Logged in user
  $('#header-user-name').text(data.username);

  // Change sidebar
  if (instant || false) {
    $('#header-user-container').show();
    update_nav(data);
    var target = !document.location.hash || document.location.hash == "#login" ? $('#side-nav').find('a.nav-link')[0].getAttribute('href') : document.location.hash;
    console.log(target);
    $("a.nav-link[href$=\"" + target + "\"]").tab('show');
  } else {
    $('#header-user-container').fadeIn();
    $('#sidebar').fadeOut(300, function() {
      update_nav(data);
      $('#sidebar').fadeIn();

      var target = !document.location.hash || document.location.hash == "#login" ? $('#side-nav').find('a.nav-link')[0].getAttribute('href') : document.location.hash;
      $("a.nav-link[href$=\"" + target + "\"]").tab('show');
    });
  }


}

$('#login-form').submit(login);
