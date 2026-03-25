package cn.surveyking.server.domain.mapper;

import cn.surveyking.server.core.base.mapper.BaseModelMapper;
import cn.surveyking.server.domain.dto.RepoPartnerRequest;
import cn.surveyking.server.domain.dto.RepoPartnerView;
import cn.surveyking.server.domain.model.RepoPartner;
import org.mapstruct.Mapper;

@Mapper
public interface RepoPartnerViewMapper extends BaseModelMapper<RepoPartnerRequest, RepoPartnerView, RepoPartner> {

}
