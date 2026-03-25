package cn.surveyking.server.impl;

import cn.surveyking.server.core.common.PaginationResponse;
import cn.surveyking.server.core.uitls.SecurityContextUtils;
import cn.surveyking.server.domain.dto.RepoPartnerQuery;
import cn.surveyking.server.domain.dto.RepoPartnerRequest;
import cn.surveyking.server.domain.dto.RepoPartnerView;
import cn.surveyking.server.domain.mapper.RepoPartnerViewMapper;
import cn.surveyking.server.domain.model.Repo;
import cn.surveyking.server.domain.model.RepoPartner;
import cn.surveyking.server.mapper.RepoMapper;
import cn.surveyking.server.mapper.RepoPartnerMapper;
import cn.surveyking.server.service.BaseService;
import cn.surveyking.server.service.RepoPartnerService;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class RepoPartnerServiceImpl extends BaseService<RepoPartnerMapper, RepoPartner> implements RepoPartnerService {

	private final UserServiceImpl userService;

	private final RepoMapper repoMapper;

	private final RepoPartnerViewMapper repoPartnerViewMapper;

	@Override
	public PaginationResponse<RepoPartnerView> listRepoPartner(RepoPartnerQuery query) {
		assertManagePermission(query.getRepoId());
		Page<RepoPartner> page = pageByQuery(query,
				Wrappers.<RepoPartner>lambdaQuery()
						.eq(RepoPartner::getRepoId, query.getRepoId())
						.apply(StringUtils.hasText(query.getUserName()),
								"EXISTS (SELECT 1 FROM t_user WHERE t_user.id = t_repo_partner.user_id AND t_user.name = {0})",
								query.getUserName())
						.orderByAsc(RepoPartner::getCreateAt));
		PaginationResponse<RepoPartnerView> result = new PaginationResponse<>(page.getTotal(),
				repoPartnerViewMapper.toView(page.getRecords()));
		result.getList().forEach(view -> {
			if (view.getUserId() != null) {
				view.setUser(userService.loadUserById(view.getUserId()));
			}
		});
		return result;
	}

	@Override
	public void addRepoPartner(RepoPartnerRequest request) {
		assertManagePermission(request.getRepoId());
		if (CollectionUtils.isEmpty(request.getUserIds())) {
			return;
		}
		List<RepoPartner> existPartners = list(Wrappers.<RepoPartner>lambdaQuery()
				.eq(RepoPartner::getRepoId, request.getRepoId())
				.in(RepoPartner::getUserId, request.getUserIds()));
		List<RepoPartner> partners = request.getUserIds().stream()
				.filter(userId -> existPartners.stream().noneMatch(partner -> Objects.equals(partner.getUserId(), userId)))
				.map(userId -> {
					RepoPartner partner = new RepoPartner();
					partner.setRepoId(request.getRepoId());
					partner.setUserId(userId);
					return partner;
				}).collect(Collectors.toList());
		if (!partners.isEmpty()) {
			saveBatch(partners);
		}
	}

	@Override
	public void deleteRepoPartner(RepoPartnerRequest request) {
		assertManagePermission(request.getRepoId());
		remove(Wrappers.<RepoPartner>lambdaUpdate()
				.eq(RepoPartner::getRepoId, request.getRepoId())
				.in(CollectionUtils.isNotEmpty(request.getIds()), RepoPartner::getId, request.getIds())
				.in(CollectionUtils.isNotEmpty(request.getUserIds()), RepoPartner::getUserId, request.getUserIds()));
	}

	@Override
	public boolean hasPracticePermission(String repoId, String userId) {
		if (!StringUtils.hasText(repoId) || !StringUtils.hasText(userId)) {
			return false;
		}
		Repo repo = repoMapper.selectById(repoId);
		if (repo == null) {
			return false;
		}
		if (Objects.equals(repo.getCreateBy(), userId)) {
			return true;
		}
		return count(Wrappers.<RepoPartner>lambdaQuery()
				.eq(RepoPartner::getRepoId, repoId)
				.eq(RepoPartner::getUserId, userId)) > 0;
	}

	private void assertManagePermission(String repoId) {
		Repo repo = repoMapper.selectById(repoId);
		if (repo == null || !Objects.equals(repo.getCreateBy(), SecurityContextUtils.getUserId())) {
			throw new AccessDeniedException("无权限管理该题库成员");
		}
	}
}
