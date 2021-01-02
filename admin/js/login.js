

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
    $('#sidebar-loggedin').fadeOut(300, function() {
      $('#sidebar-anon').fadeIn();
    });

  });
}

function do_login(data, instant) {

  // Change Logged in user
  $('#header-user-name').text(data.username);

  // Change sidebar
  if (instant || false) {
    $('#sidebar-anon').hide();
    $('#sidebar-loggedin').show();
    $('#header-user-container').show();
  } else {
    $('#header-user-container').fadeIn();
    $('#sidebar-anon').fadeOut(300, function() {
      $('#sidebar-loggedin').fadeIn();
    });
  }

}

$('#login-form').submit(login);
