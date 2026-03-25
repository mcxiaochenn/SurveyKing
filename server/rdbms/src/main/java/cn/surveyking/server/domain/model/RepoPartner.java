package cn.surveyking.server.domain.model;

import cn.surveyking.server.core.model.BaseModel;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@TableName(value = "t_repo_partner")
@Data
@EqualsAndHashCode(callSuper = false)
public class RepoPartner extends BaseModel {

	@TableField(value = "repo_id")
	private String repoId;

	@TableField(value = "user_id")
	private String userId;

	@TableField(exist = false)
	private static final long serialVersionUID = 1L;

	@TableField(exist = false)
	private Boolean deleted = false;
}
