<%
def lat_formatter(x):
  return x

def lon_formatter(x):
  return x


package = data['package']['package-member'] != 'package-false'

rows_left = 36

ac = context['data']['settings']['airframe']

# Flight Members is variable columns...which sucks to map between
flight_cols = [
  ["#", 30, "algnc"],
  ["PILOT", 240, "lpad5"],
]

if ac == "F-14B":
  flight_cols[1][1] /= 2;
  flight_cols.append(
    ['RIO', 120, "lpad5"])

if ac in ["F-14B", "FA-18C"]:
  flight_cols.append(['BORT', 40, "algnc"])

if ac == "A-10C":
  flight_cols.extend([
    ['GID', 40, "algnc"],
    ['OID', 40, "algnc"]])

flight_cols.extend([
  ['TCN', 40, "algnc"],
  ['LSR', 40, "algnc"],
  ['SQUAWK', 50, "algnc"],
  ['NOTES', 0, "lpad5"]])

%>

<!DOCTYPE html>
<head>
  <title>${data['mission']['mission-id']} - p1</title>
  <link rel="stylesheet" type="text/css" href="css/fonts.css">
  <link rel="stylesheet" type="text/css" href="css/kneeboard-base.css">
  <link rel="stylesheet" type="text/css" href="css/kneeboard-light.css">
  % if output.startswith("pdf"):
  <link rel="stylesheet" type="text/css" href="css/kneeboard-pdf.css">
  % endif
</head>
<body style="">
