alter table user_permissions drop foreign key `user_permissions_ibfk_1`;
alter table user_permissions drop foreign key `user_permissions_ibfk_2`;
alter table user_permissions drop key user_id;
alter table user_permissions drop key user_id_2;
alter table user_permissions add column restricts bigint(20) not null default 0;
alter table user_permissions add constraint `user_permissions_ibfk_1` foreign key(user_id) references users(idx);
alter table user_permissions add constraint `user_permissions_ibfk_2` foreign key(permission_id) references permissions(idx);
alter table user_permissions add constraint user_perms unique(user_id, permission_id, restricts);

insert into permissions(name,description) values ('squadron-edit', 'Edit a Squadron');

SET @squadron_edit = LAST_INSERT_ID();

INSERT INTO user_permissions(user_id,permission_id)
  SELECT user_id,@squadron_edit
  FROM user_permissions up
  JOIN permissions p 
    ON up.permission_id = p.idx
  WHERE p.name = 'squadrons-create';
